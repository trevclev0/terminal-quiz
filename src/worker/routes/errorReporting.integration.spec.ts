import { env, exports } from "cloudflare:workers";
import * as schema from "@shared/schema";
import { errorBeaconLimits } from "@shared/schema";
import { SESSION_COOKIE_NAME } from "@worker-middleware/session";
import {
  claimErrorBeaconSlot,
  DAY_MS,
  GLOBAL_BUCKET_KEY,
  HOUR_MS,
} from "@worker-services/errorBeaconLimit";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// trackEvent is the Analytics Engine write — counting its calls is how these
// specs prove a rejected beacon writes nothing.
vi.mock("@worker-graphql/gameplay/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@worker-graphql/gameplay/analytics";

// Typed with the full schema — claimErrorBeaconSlot takes the app's db.
const db = drizzle(env.DB, { schema });

// Mirror ERROR_BEACON_IP_HOURLY_LIMIT / ERROR_BEACON_DAILY_BUDGET in
// vitest.config.integration.ts.
const IP_HOURLY_LIMIT = 3;
const DAILY_BUDGET = 5;

const VALID_BODY = JSON.stringify({ source: "boundary", message: "boom" });

type BeaconOptions = { ip?: string; sessionId?: string; body?: string };

function postBeacon({
  ip,
  sessionId,
  body = VALID_BODY,
}: BeaconOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ip) headers["CF-Connecting-IP"] = ip;
  if (sessionId) headers.Cookie = `${SESSION_COOKIE_NAME}=${sessionId}`;
  return exports.default.fetch(
    new Request("http://localhost/api/error", {
      method: "POST",
      headers,
      body,
    }),
  );
}

async function statusesFor(count: number, options: BeaconOptions) {
  const statuses: number[] = [];
  for (let i = 0; i < count; i++) {
    statuses.push((await postBeacon(options)).status);
  }
  return statuses;
}

async function globalCount(): Promise<number> {
  const rows = await db
    .select({ requestCount: errorBeaconLimits.requestCount })
    .from(errorBeaconLimits)
    .where(eq(errorBeaconLimits.bucketKey, GLOBAL_BUCKET_KEY));
  return rows[0]?.requestCount ?? 0;
}

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await db.delete(errorBeaconLimits);
  vi.mocked(trackEvent).mockClear();
});

describe("POST /api/error volume limiter", () => {
  it("accepts exactly the per-IP limit for one session, then 429s without writing", async () => {
    const sessionId = crypto.randomUUID();
    const responses: Response[] = [];
    for (let i = 0; i < IP_HOURLY_LIMIT + 2; i++) {
      responses.push(await postBeacon({ ip: "203.0.113.7", sessionId }));
    }

    expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 429, 429]);
    expect(await responses[3].json()).toEqual({ ok: false });
    expect(vi.mocked(trackEvent)).toHaveBeenCalledTimes(IP_HOURLY_LIMIT);
  });

  it("does not reset the budget for a cookie-less flood minting a session per request", async () => {
    const statuses = await statusesFor(IP_HOURLY_LIMIT + 2, {
      ip: "203.0.113.8",
    });

    expect(statuses.filter((s) => s === 200)).toHaveLength(IP_HOURLY_LIMIT);
    expect(vi.mocked(trackEvent)).toHaveBeenCalledTimes(IP_HOURLY_LIMIT);
  });

  it("holds the per-IP limit under a concurrent flood", async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => postBeacon({ ip: "203.0.113.9" })),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(IP_HOURLY_LIMIT);
    expect(statuses.filter((s) => s === 429)).toHaveLength(
      10 - IP_HOURLY_LIMIT,
    );
    expect(vi.mocked(trackEvent)).toHaveBeenCalledTimes(IP_HOURLY_LIMIT);
  });

  it("sends Retry-After up to the end of the client's clock hour", async () => {
    await statusesFor(IP_HOURLY_LIMIT, { ip: "203.0.113.10" });
    const rejected = await postBeacon({ ip: "203.0.113.10" });

    expect(rejected.status).toBe(429);
    const retryAfter = Number(rejected.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(HOUR_MS / 1000);
  });

  it("gives each client IP its own bucket", async () => {
    await statusesFor(IP_HOURLY_LIMIT, { ip: "203.0.113.11" });
    expect((await postBeacon({ ip: "203.0.113.11" })).status).toBe(429);

    expect((await postBeacon({ ip: "203.0.113.12" })).status).toBe(200);
  });

  it("buckets IPv6 clients by /64 prefix", async () => {
    await statusesFor(IP_HOURLY_LIMIT, { ip: "2001:db8:1:2::1" });

    // Same /64, different interface id — same subscriber, same bucket.
    expect((await postBeacon({ ip: "2001:db8:1:2:ffff::9" })).status).toBe(429);
    // Neighboring /64 — a different bucket.
    expect((await postBeacon({ ip: "2001:db8:1:3::1" })).status).toBe(200);
  });

  it("caps accepted beacons per UTC day across all clients", async () => {
    for (let i = 1; i <= DAILY_BUDGET; i++) {
      expect((await postBeacon({ ip: `198.51.100.${i}` })).status).toBe(200);
    }

    const rejected = await postBeacon({ ip: "198.51.100.200" });
    expect(rejected.status).toBe(429);
    expect(await rejected.json()).toEqual({ ok: false });
    const retryAfter = Number(rejected.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(DAY_MS / 1000);
    expect(vi.mocked(trackEvent)).toHaveBeenCalledTimes(DAILY_BUDGET);
    expect(await globalCount()).toBe(DAILY_BUDGET);
  });

  it("does not spend the daily budget on beacons the per-IP limit rejects", async () => {
    await statusesFor(IP_HOURLY_LIMIT + 4, { ip: "203.0.113.13" });

    expect(await globalCount()).toBe(IP_HOURLY_LIMIT);
    // The remaining daily budget is still available to other clients.
    expect((await postBeacon({ ip: "203.0.113.14" })).status).toBe(200);
    expect((await postBeacon({ ip: "203.0.113.15" })).status).toBe(200);
    expect(await globalCount()).toBe(DAILY_BUDGET);
  });

  it("never counts malformed or oversized beacons", async () => {
    const ip = "203.0.113.16";
    expect((await postBeacon({ ip, body: "{not-json" })).status).toBe(400);
    expect(
      (await postBeacon({ ip, body: JSON.stringify({ source: "nope" }) }))
        .status,
    ).toBe(400);
    expect(
      (
        await postBeacon({
          ip,
          body: JSON.stringify({ message: "x".repeat(4096) }),
        })
      ).status,
    ).toBe(413);

    expect(await db.select().from(errorBeaconLimits)).toHaveLength(0);
  });

  it("stores a keyed hash of the client, never the raw IP", async () => {
    const ip = "192.0.2.123";
    await postBeacon({ ip });

    const keys = (
      await db
        .select({ bucketKey: errorBeaconLimits.bucketKey })
        .from(errorBeaconLimits)
    ).map((row) => row.bucketKey);
    expect(keys).toHaveLength(2);
    expect(keys).toContain(GLOBAL_BUCKET_KEY);
    const clientKey = keys.find((key) => key !== GLOBAL_BUCKET_KEY);
    expect(clientKey).toMatch(/^ip:[0-9a-f]{32}$/);
    expect(clientKey).not.toContain(ip);
  });

  it("prunes expired windows when a beacon is claimed", async () => {
    const past = Date.now() - 2 * HOUR_MS;
    await db.insert(errorBeaconLimits).values({
      bucketKey: "ip:stale",
      windowStart: new Date(past),
      requestCount: 3,
      expiresAt: new Date(past + HOUR_MS),
    });

    await postBeacon({ ip: "203.0.113.17" });

    const stale = await db
      .select()
      .from(errorBeaconLimits)
      .where(eq(errorBeaconLimits.bucketKey, "ip:stale"));
    expect(stale).toHaveLength(0);
  });
});

describe("claimErrorBeaconSlot windows", () => {
  const limits = { ipHourlyLimit: 2, dailyBudget: 100 };
  // An arbitrary instant 30 minutes into a clock hour.
  const base = Date.UTC(2026, 0, 15, 10, 30);

  it("opens a fresh client window at the next clock hour", async () => {
    await claimErrorBeaconSlot(db, "ip:window", limits, base);
    await claimErrorBeaconSlot(db, "ip:window", limits, base);
    expect(
      await claimErrorBeaconSlot(db, "ip:window", limits, base),
    ).toMatchObject({ allowed: false, scope: "ip", retryAfterSeconds: 1800 });

    const nextHour = base + 30 * 60 * 1000;
    expect(
      await claimErrorBeaconSlot(db, "ip:window", limits, nextHour),
    ).toEqual({ allowed: true });
  });

  it("resets the daily budget at UTC midnight", async () => {
    const tight = { ipHourlyLimit: 10, dailyBudget: 1 };
    const lateNight = Date.UTC(2026, 0, 15, 23, 59);
    expect(
      await claimErrorBeaconSlot(db, "ip:day-a", tight, lateNight),
    ).toEqual({ allowed: true });
    expect(
      await claimErrorBeaconSlot(db, "ip:day-b", tight, lateNight),
    ).toMatchObject({ allowed: false, scope: "global", retryAfterSeconds: 60 });

    const afterMidnight = Date.UTC(2026, 0, 16, 0, 1);
    expect(
      await claimErrorBeaconSlot(db, "ip:day-b", tight, afterMidnight),
    ).toEqual({ allowed: true });
  });
});
