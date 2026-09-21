import { vi } from "vitest";

/**
 * Report `prefers-reduced-motion: reduce` to the code under test.
 *
 * Typed surfaces resolve to their full text immediately under reduced
 * motion, and CrtOverlay skips its boot sequence outright. Specs that care
 * about what ends up on screen — rather than about the typing itself — use
 * this so they do not have to drive typewriter timings to get there.
 *
 * Call from `beforeEach`; the stub is cleared by `vi.unstubAllGlobals()`.
 */
export function stubReducedMotion(matches = true) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}
