import type { Ai, AiTextGenerationOutput } from "@cloudflare/workers-types";
import { MAX_CLUES_PER_GATE } from "@shared/types";
import { MAX_CLUES_PER_GATE } from "@shared/types";
import type { Context } from "hono";
import { env } from "hono/adapter";

// Maximum length for the AI-generated clue to prevent
// overly verbose responses.
const MAX_CLUE_LENGTH = 200;

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// System prompt instructing the AI on its role and constraints
// for generating clues.
const SYSTEM_PROMPT = `
You are a helpful hint-giver for a text-based riddle game.

Rules:
1. NEVER state, spell out, or directly paraphrase the correct answer.
2. Do not reveal answer length, first/last letter, or rhymes unless explicitly asked to nudge that way.
3. Each clue must add NEW information not present in previous clues — no repeating prior phrasing.
4. Match clue style to the answer type (e.g. a date gets a time-period hint, a name gets a role/context hint, a phrase gets a meaning hint) — infer this from the gate question and answer.
5. If the guess is semantically close (synonym, right category, partial match), acknowledge it's "on the right track" before nudging further.
6. If the guess is far off, redirect toward the correct concept rather than critiquing the wrong guess.
7. Output ONLY the clue text — no preamble, no labels, no quotes around it.
8. Keep clues under ${MAX_CLUE_LENGTH} characters.
You are a helpful hint-giver for a text-based riddle game.

Rules:
1. NEVER state, spell out, or directly paraphrase the correct answer.
2. Do not reveal answer length, first/last letter, or rhymes unless explicitly asked to nudge that way.
3. Each clue must add NEW information not present in previous clues — no repeating prior phrasing.
4. Match clue style to the answer type (e.g. a date gets a time-period hint, a name gets a role/context hint, a phrase gets a meaning hint) — infer this from the gate question and answer.
5. If the guess is semantically close (synonym, right category, partial match), acknowledge it's "on the right track" before nudging further.
6. If the guess is far off, redirect toward the correct concept rather than critiquing the wrong guess.
7. Output ONLY the clue text — no preamble, no labels, no quotes around it.
8. Keep clues under ${MAX_CLUE_LENGTH} characters.
`.trim();

/**
 * Generates a clue using Cloudflare Workers AI.
 * @param c Hono Context to access the AI binding.
 * @param gateQuestion The question of the gate.
 * @param correctAnswer The correct answer to the gate (for AI context, not for revelation).
 * @param currentGuess The player's current (incorrect) guess.
 * @param previousClues An array of clues previously given for this gate in the current session.
 * @returns A generated clue string or null if the AI service fails or no clue is generated.
 */
export async function generateClue(
  c: Context,
  gateQuestion: string,
  correctAnswer: string,
  currentGuess: string,
  previousClues: string[],
): Promise<string | null> {
  const { AI } = env<{ AI: Ai }>(c);

  if (!AI) {
    console.error("AI binding not available.");
    return null;
  }

  const safeGuess = currentGuess.replace(/"/g, '\\"');
  // Construct the user prompt with all relevant context.
  let userPrompt = `
Gate Question: "${gateQuestion}"
Correct Answer (never reveal): "${correctAnswer}"
Player's current incorrect guess: "${safeGuess}"
Clue attempt: ${previousClues.length + 1} of ${MAX_CLUES_PER_GATE}
`.trim();

  if (previousClues.length > 0) {
    userPrompt += `\nPrevious clues already given (do not repeat these):
${previousClues.map((clue, i) => `${i + 1}. "${clue}"`).join("\n")}`;
  }

  // Add a reminder not to reveal the answer directly.
  userPrompt += `\nGenerate the next clue, strictly better/more specific than the previous ones, without revealing the answer.`;
  userPrompt += `\nGenerate the next clue, strictly better/more specific than the previous ones, without revealing the answer.`;

  try {
    const response = (await AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      // Ensure the AI doesn't get too creative and sticks to the point.
      temperature: 0.7,
      max_tokens: 100, // Limit AI response to encourage conciseness
    })) as AiTextGenerationOutput;

    // Extract the AI's response content.
    const clueText = response.response?.trim();

    if (!clueText) {
      console.warn("AI returned an empty response for clue generation.");
      return null;
    }

    // Basic check to ensure the AI didn't directly reveal the answer.
    // This is a safeguard, as the system prompt should ideally prevent it.
    const escapedAnswer = escapeRegExp(correctAnswer);
    const startBoundary = /^\w/.test(correctAnswer) ? "\\b" : "";
    const endBoundary = /\w$/.test(correctAnswer) ? "\\b" : "";
    const answerRegex = new RegExp(
      `${startBoundary}${escapedAnswer}${endBoundary}`,
      "i",
    );
    if (answerRegex.test(clueText)) {
      console.warn("AI generated a clue containing the answer. Filtering.");
      return null;
    }

    // Trim to maximum length to prevent overly long clues.
    return clueText.substring(0, MAX_CLUE_LENGTH);
  } catch (error) {
    console.error("Error generating clue with AI service:", error);
    return null; // Return null on error to indicate failure to generate a clue.
  }
}
