export const MAX_CLUES_PER_GATE = 3;

// Longest guess the server accepts (after trimming). Shared with the guess
// input's maxLength; also caps the guess interpolated into the AI prompt.
export const MAX_GUESS_LENGTH = 500;

import type { programs } from "@shared/schema";

export type Program = typeof programs.$inferSelect;
