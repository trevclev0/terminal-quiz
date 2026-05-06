import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// import '@testing-library/jest-dom';

// Automatically unmount and clean up the DOM after each test.
// Required when Vitest globals are disabled; harmless when they're enabled.
afterEach(() => {
  cleanup();
});
