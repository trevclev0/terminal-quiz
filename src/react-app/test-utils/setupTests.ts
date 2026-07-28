import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Stub Better Auth client to prevent BroadcastChannel timer setup that
// fires after test teardown (ReferenceError: window is not defined).
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({
    useSession: () => ({ data: null }),
    signOut: vi.fn(),
    signIn: { social: vi.fn() },
  }),
}));

// import '@testing-library/jest-dom';

// Automatically unmount and clean up the DOM after each test.
// Required when Vitest globals are disabled; harmless when they're enabled.
afterEach(() => {
  cleanup();
});
