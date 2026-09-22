import { errorBeaconLimits } from "@shared/schema";
import type { AppVariables } from "@worker-middleware/db";
import { logError } from "@worker-utils/errorHandler";
import { lte, sql } from "drizzle-orm";
import type { Context } from "hono";

// Defaults when the ERROR_BEACON_* vars are unset. A healthy client sends a
// handful of beacons per broken page load (the in-app reporter throttles to
// ~1/sec), so 30/hour per client leaves room for a shared NAT; 1,000/day
// across all clients bounds Analytics Engine spend far below the free tier.
export const DEFAULT_ERROR_BEACON_IP_HOURLY_LIMIT = 30;
export const DEFAULT_ERROR_BEACON_DAILY_BUDGET = 1000;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

// How long an ended window's row survives before the prune may delete it.
// A claim picks its windows from the clock reading taken when the beacon
// arrived, so a beacon in flight across a boundary still claims in the
// window that just ended. Had the prune already deleted that row, the claim
// would recreate it at count 1 and slip past an exhausted limit. The grace
// outlasts any request by orders of magnitude, so a late claim always meets
// the row it would otherwise recreate.
export const PRUNE_GRACE_MS = HOUR_MS;
export const GLOBAL_BUCKET_KEY = "global";
const UNKNOWN_SUBJECT = "unknown";
const HASH_PURPOSE = "error-beacon-limit";

type Db = AppVariables["Variables"]["db"];

export type ErrorBeaconLimits = {
  ipHourlyLimit: number;
  dailyBudget: number;
};

export type ErrorBeaconLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      scope: "ip" | "global";
      retryAfterSeconds: number;
    };

/** A positive integer from an env var, or `fallback` when unset/invalid. */
export function parseLimit(raw: string | undefined, fallback: number): number {
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Canonical dotted-quad form of an IPv4 address, or null if not one. */
function normalizeIpv4(ip: string): string | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  return octets.every((octet) => octet <= 255) ? octets.join(".") : null;
}

/**
 * The eight 16-bit groups of an IPv6 address — expanding "::" and a trailing
 * dotted quad — or null if `ip` is not a valid IPv6 address.
 */
function parseIpv6(ip: string): number[] | null {
  // Drop a zone id (fe80::1%eth0) — it names a local interface, not a host.
  const halves = ip.split("%")[0].split("::");
  if (halves.length > 2) return null;
  const groups = halves.map((half) => (half === "" ? [] : half.split(":")));

  // A trailing dotted quad (::ffff:192.0.2.1) stands for the last two groups.
  const lastHalf = groups[groups.length - 1];
  const lastGroup = lastHalf[lastHalf.length - 1];
  if (lastGroup?.includes(".")) {
    const ipv4 = normalizeIpv4(lastGroup);
    if (!ipv4) return null;
    const [a, b, c, d] = ipv4.split(".").map(Number);
    lastHalf.splice(
      -1,
      1,
      ((a << 8) | b).toString(16),
      ((c << 8) | d).toString(16),
    );
  }

  const [head, tail = []] = groups;
  const elided = 8 - head.length - tail.length;
  // Without "::" all eight groups must be present; "::" stands for ≥1 group.
  if (halves.length === 1 ? elided !== 0 : elided < 1) return null;
  const all = [
    ...head,
    ...Array<string>(halves.length === 2 ? elided : 0).fill("0"),
    ...tail,
  ];
  if (!all.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
  return all.map((group) => Number.parseInt(group, 16));
}

/**
 * Reduces a client IP to the unit a per-client limit applies to: an IPv4
 * address whole, an IPv6 address by its /64 prefix. A single subscriber is
 * routinely delegated an entire /64, so keying on the full IPv6 address
 * would let one client rotate through 2^64 fresh buckets. IPv4-mapped IPv6
 * (::ffff:a.b.c.d) is an IPv4 client and is keyed as one. A missing or
 * unparseable address (local dev has no CF-Connecting-IP) shares a single
 * `unknown` bucket.
 */
export function toLimitSubject(ip: string | undefined): string {
  if (!ip) return UNKNOWN_SUBJECT;
  const address = ip.trim().toLowerCase();

  const ipv4 = normalizeIpv4(address);
  if (ipv4) return ipv4;

  const groups = parseIpv6(address);
  if (!groups) return UNKNOWN_SUBJECT;
  if (
    groups.slice(0, 5).every((group) => group === 0) &&
    groups[5] === 0xffff
  ) {
    return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff]
      .map(String)
      .join(".");
  }
  const prefix = groups
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(":");
  return `${prefix}::/64`;
}

const encoder = new TextEncoder();

/**
 * Keyed hash of a limit subject, so the table never holds a client IP —
 * not even one recoverable by brute force, as an unkeyed digest of an IPv4
 * address is (2^32 candidates). The HMAC key is derived from
 * BETTER_AUTH_SECRET via HKDF under a purpose label, so it is never the key
 * Better Auth itself signs with.
 */
export async function hashLimitSubject(
  subject: string,
  secret: string,
): Promise<string> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  const hmacKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: encoder.encode(HASH_PURPOSE),
    },
    baseKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(subject),
  );
  return Array.from(new Uint8Array(mac).slice(0, 16), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * One atomic claim against a fixed-window bucket:
 *   INSERT INTO error_beacon_limits
 *     (bucket_key, window_start, request_count, expires_at)
 *   VALUES (<bucketKey>, <windowStart>, 1, <windowStart + windowMs>)
 *   ON CONFLICT (bucket_key, window_start) DO UPDATE
 *     SET request_count = request_count + 1
 *     WHERE request_count < <limit>
 *   RETURNING request_count
 *
 * A row comes back only when this request inserted or incremented the
 * bucket, so an empty result means the bucket is full. A full bucket is left
 * untouched — rejected requests cost no row write. SQLite serializes writes,
 * so concurrent claims cannot overshoot the limit.
 */
function claimSlot(
  db: Db,
  bucketKey: string,
  windowStartMs: number,
  windowMs: number,
  limit: number,
) {
  return db
    .insert(errorBeaconLimits)
    .values({
      bucketKey,
      windowStart: new Date(windowStartMs),
      requestCount: 1,
      expiresAt: new Date(windowStartMs + windowMs),
    })
    .onConflictDoUpdate({
      target: [errorBeaconLimits.bucketKey, errorBeaconLimits.windowStart],
      set: { requestCount: sql`${errorBeaconLimits.requestCount} + 1` },
      setWhere: sql`${errorBeaconLimits.requestCount} < ${limit}`,
    })
    .returning({ requestCount: errorBeaconLimits.requestCount });
}

/**
 * Claims one accepted-beacon slot: first in the client's clock-hour bucket,
 * then in the global UTC-day bucket.
 *
 * The global claim runs only once the client claim has succeeded, so a
 * client already over its own limit cannot burn the shared daily budget and
 * starve everyone else's error reports. The converse is accepted: a beacon
 * the global ceiling rejects has still spent its client's slot. Windows
 * that ended more than PRUNE_GRACE_MS ago (every client's) are pruned in
 * the same batch as the client claim, so abandoned buckets never
 * accumulate.
 */
export async function claimErrorBeaconSlot(
  db: Db,
  clientBucketKey: string,
  limits: ErrorBeaconLimits,
  nowMs: number = Date.now(),
): Promise<ErrorBeaconLimitResult> {
  const hourStartMs = Math.floor(nowMs / HOUR_MS) * HOUR_MS;
  const [clientClaim] = await db.batch([
    claimSlot(db, clientBucketKey, hourStartMs, HOUR_MS, limits.ipHourlyLimit),
    db
      .delete(errorBeaconLimits)
      .where(
        lte(errorBeaconLimits.expiresAt, new Date(nowMs - PRUNE_GRACE_MS)),
      ),
  ]);
  if (clientClaim.length === 0) {
    return {
      allowed: false,
      scope: "ip",
      retryAfterSeconds: Math.ceil((hourStartMs + HOUR_MS - nowMs) / 1000),
    };
  }

  const dayStartMs = Math.floor(nowMs / DAY_MS) * DAY_MS;
  const globalClaim = await claimSlot(
    db,
    GLOBAL_BUCKET_KEY,
    dayStartMs,
    DAY_MS,
    limits.dailyBudget,
  );
  if (globalClaim.length === 0) {
    return {
      allowed: false,
      scope: "global",
      retryAfterSeconds: Math.ceil((dayStartMs + DAY_MS - nowMs) / 1000),
    };
  }

  return { allowed: true };
}

/**
 * Server-side volume limiter for the public POST /api/error beacon.
 *
 * Keys on the client IP (CF-Connecting-IP), not the session: the route mints
 * a fresh session cookie for every cookie-less request, so a per-session cap
 * would hand a flood a new budget on every request.
 *
 * Fails open. The beacon exists to report errors while the stack is
 * degraded, so a limiter failure (D1 unavailable, a missing binding) logs
 * and accepts the beacon rather than losing the report — at worst this
 * falls back to the pre-limiter behavior.
 */
export async function checkErrorBeaconLimit(
  c: Context<AppVariables>,
): Promise<ErrorBeaconLimitResult> {
  try {
    const subject = toLimitSubject(c.req.header("cf-connecting-ip"));
    const clientBucketKey = `ip:${await hashLimitSubject(
      subject,
      c.env.BETTER_AUTH_SECRET,
    )}`;
    return await claimErrorBeaconSlot(c.get("db"), clientBucketKey, {
      ipHourlyLimit: parseLimit(
        c.env.ERROR_BEACON_IP_HOURLY_LIMIT,
        DEFAULT_ERROR_BEACON_IP_HOURLY_LIMIT,
      ),
      dailyBudget: parseLimit(
        c.env.ERROR_BEACON_DAILY_BUDGET,
        DEFAULT_ERROR_BEACON_DAILY_BUDGET,
      ),
    });
  } catch (error) {
    logError(
      new Error("Error beacon limiter failed open", { cause: error }),
      c.req.method,
      c.req.path,
      c.get("requestId"),
    );
    return { allowed: true };
  }
}
