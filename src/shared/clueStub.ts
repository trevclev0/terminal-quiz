/**
 * Canned clue served in place of a real generation when `AI_CLUE_STUB` is on
 * (#307). Shared so preview E2E can assert this exact text: a match proves
 * the run spent no Workers AI neurons. Import-free so Playwright can load it
 * without the worker's path aliases.
 */
export const STUB_CLUE_TEXT =
  "[stub] Clue generation is stubbed in this environment.";
