/**
 * Slash commands a player can type in the answer box. Zod-free on purpose:
 * the gameplay bundle imports this, and validation.ts (which pulls in zod)
 * imports it back to reserve these strings as gate answers.
 */
export const GAME_COMMANDS = ["/clue", "/help"] as const;
export type GameCommand = (typeof GAME_COMMANDS)[number];

/** Exact match after trim and lowercase; anything else is a normal guess. */
export function parseGameCommand(input: string): GameCommand | null {
  const normalized = input.trim().toLowerCase();
  return GAME_COMMANDS.find((command) => command === normalized) ?? null;
}
