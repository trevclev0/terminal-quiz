import { describe, expect, it } from "vitest";
import { parseGameCommand } from "./gameCommands";

describe("parseGameCommand", () => {
  it("recognises each command, ignoring case and surrounding whitespace", () => {
    expect(parseGameCommand("/clue")).toBe("/clue");
    expect(parseGameCommand("  /HELP ")).toBe("/help");
  });

  it.each(["/clues", "/clue please", "/dev/null", "clue", ""])(
    "treats %j as a normal guess",
    (input) => {
      expect(parseGameCommand(input)).toBeNull();
    },
  );
});
