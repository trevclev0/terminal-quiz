import type { AppVariables } from "@worker-middleware/db";
import { createMockEnv } from "@worker-test-utils/mockEnv";
import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";
import {
  checkErrorBeaconLimit,
  DEFAULT_ERROR_BEACON_DAILY_BUDGET,
  hashLimitSubject,
  parseLimit,
  toLimitSubject,
} from "./errorBeaconLimit";

// The shared fake secret from mockEnv — no new secret-shaped literal.
const SECRET = createMockEnv().BETTER_AUTH_SECRET;

describe("toLimitSubject", () => {
  it("keys IPv4 clients by the whole address", () => {
    expect(toLimitSubject("203.0.113.7")).toBe("203.0.113.7");
  });

  it("canonicalizes padded IPv4 octets", () => {
    expect(toLimitSubject("203.000.113.007")).toBe("203.0.113.7");
  });

  it("keys IPv6 clients by their /64 prefix", () => {
    expect(toLimitSubject("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe(
      "2001:db8:1:2::/64",
    );
  });

  it("puts every address in one /64 in the same bucket", () => {
    const subject = toLimitSubject("2001:db8:1:2::1");
    expect(toLimitSubject("2001:db8:1:2:ffff::9")).toBe(subject);
    expect(toLimitSubject("2001:DB8:1:2::abcd")).toBe(subject);
    expect(toLimitSubject("2001:0db8:0001:0002:0:0:0:1")).toBe(subject);
  });

  it("separates neighboring /64 prefixes", () => {
    expect(toLimitSubject("2001:db8:1:2::1")).not.toBe(
      toLimitSubject("2001:db8:1:3::1"),
    );
  });

  it("expands a leading or trailing :: elision", () => {
    expect(toLimitSubject("::1")).toBe("0:0:0:0::/64");
    expect(toLimitSubject("2001:db8::")).toBe("2001:db8:0:0::/64");
  });

  it("drops an IPv6 zone id", () => {
    expect(toLimitSubject("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
  });

  it("keys IPv4-mapped IPv6 as the IPv4 client it is", () => {
    expect(toLimitSubject("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(toLimitSubject("::ffff:cb00:7107")).toBe("203.0.113.7");
  });

  it("falls back to one shared bucket for a missing or unparseable address", () => {
    for (const ip of [
      undefined,
      "",
      "not-an-ip",
      "256.1.1.1",
      "1.2.3",
      "1:2:3:4:5:6:7:8:9",
      "1::2::3",
      "12345::1",
      "::ffff:999.0.0.1",
    ]) {
      expect(toLimitSubject(ip)).toBe("unknown");
    }
  });
});

describe("parseLimit", () => {
  it("parses a positive integer", () => {
    expect(parseLimit("12", 30)).toBe(12);
  });

  it("falls back on unset, zero, negative, or non-numeric values", () => {
    for (const raw of [undefined, "", "0", "-5", "abc"]) {
      expect(parseLimit(raw, 30)).toBe(30);
    }
  });
});

describe("hashLimitSubject", () => {
  it("is deterministic and never contains the subject", async () => {
    const first = await hashLimitSubject("203.0.113.7", SECRET);
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(await hashLimitSubject("203.0.113.7", SECRET)).toBe(first);
    expect(first).not.toContain("203");
  });

  it("differs per subject and per secret", async () => {
    const base = await hashLimitSubject("203.0.113.7", SECRET);
    expect(await hashLimitSubject("203.0.113.8", SECRET)).not.toBe(base);
    expect(await hashLimitSubject("203.0.113.7", `${SECRET}x`)).not.toBe(base);
  });
});

describe("checkErrorBeaconLimit", () => {
  function createContext(db: unknown) {
    const values: Record<string, unknown> = { db, requestId: "req-1" };
    return {
      env: {
        BETTER_AUTH_SECRET: SECRET,
        ERROR_BEACON_DAILY_BUDGET: String(DEFAULT_ERROR_BEACON_DAILY_BUDGET),
      },
      req: {
        method: "POST",
        path: "/api/error",
        header: (name: string) =>
          name.toLowerCase() === "cf-connecting-ip" ? "203.0.113.7" : undefined,
      },
      get: (key: string) => values[key],
    } as unknown as Context<AppVariables>;
  }

  function createDb(batch: () => Promise<unknown>) {
    const chain: Record<string, unknown> = {};
    for (const method of [
      "values",
      "onConflictDoUpdate",
      "returning",
      "where",
    ]) {
      chain[method] = () => chain;
    }
    return { insert: () => chain, delete: () => chain, batch };
  }

  it("fails open and logs when D1 is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const db = createDb(() =>
      Promise.reject(new Error("D1_ERROR: database unavailable")),
    );

    await expect(checkErrorBeaconLimit(createContext(db))).resolves.toEqual({
      allowed: true,
    });

    expect(consoleError).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(consoleError.mock.calls[0][0] as string);
    expect(logged).toMatchObject({
      level: "error",
      path: "/api/error",
      requestId: "req-1",
      message: "Error beacon limiter failed open",
    });
    expect(logged.cause).toContain("database unavailable");
  });

  it("reports the client limit when the client bucket is full", async () => {
    const db = createDb(() => Promise.resolve([[], []]));

    const result = await checkErrorBeaconLimit(createContext(db));

    expect(result).toMatchObject({ allowed: false, scope: "ip" });
  });
});
