import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionId } from "./session";

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn(),
    setItem: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSessionId", () => {
  it("generates and persists a new session ID when none exists", () => {
    const id = getSessionId();
    expect(id).toBeTruthy();
    expect(localStorage.getItem).toHaveBeenCalledWith(
      "terminal_quiz_session_id",
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "terminal_quiz_session_id",
      id,
    );
  });

  it("returns existing session ID from localStorage", () => {
    const existingId = crypto.randomUUID();
    vi.mocked(localStorage.getItem).mockReturnValue(existingId);
    expect(getSessionId()).toBe(existingId);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("falls back to in-memory UUID when localStorage is unavailable", () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error("localStorage unavailable");
    });
    const id = getSessionId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("returns same in-memory UUID on subsequent calls when localStorage is unavailable", () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error("localStorage unavailable");
    });
    const first = getSessionId();
    const second = getSessionId();
    expect(second).toBe(first);
  });
});
