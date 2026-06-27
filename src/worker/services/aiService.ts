import { env } from "hono/adapter";
import { type Context } from "hono";

// Maximum length for the AI-generated clue to prevent overly verbose responses.
const MAX_CLUE_LENGTH = 200;

// System prompt instructing the AI on its role and constraints for generating clues.
const SYSTEM_PROMPT = `
You are a helpful assistant for a terminal-based riddle game. Your goal is to provide hints to the player without directly revealing the correct answer.

Here are the strict rules you must follow:
1.  NEVER reveal the exact correct answer.
2.  Provide clues that are short, concise, and helpful for a riddle.
3.  Consider the current question, the player's last guess, and any previous clues given.
4.  If the player's guess is very close but incorrect, provide a subtle nudge.
5.  Keep clues under ${MAX_CLUE_LENGTH} characters.
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
  const { AI } = env<{ AI: AiTextGeneration }>(c);

  if (!AI) {
    console.error("AI binding not available.");
    return null;
  }

  // Construct the user prompt with all relevant context.
  let userPrompt = `
Gate Question: "${gateQuestion}"
Player's current incorrect guess: "${currentGuess}"
`.trim();

  if (previousClues.length > 0) {
    userPrompt += `\nPrevious clues given:
${previousClues.map((clue, i) => `${i + 1}. "${clue}"`).join("\n")}
`.trim();
  }

  // Add a reminder not to reveal the answer directly.
  userPrompt += `\nGenerate a new, short, and subtle clue without revealing "${correctAnswer}".`.trim();

  try {
    const response = await AI.run("@cf/mistral/mistral-7-b-instruct-v0.1", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      // Ensure the AI doesn't get too creative and sticks to the point.
      temperature: 0.7,
      max_tokens: 100, // Limit AI response to encourage conciseness
    });

    // Extract the AI's response content.
    const clueText = response.response?.trim();

    if (!clueText) {
      console.warn("AI returned an empty response for clue generation.");
      return null;
    }

    // Basic check to ensure the AI didn't directly reveal the answer.
    // This is a safeguard, as the system prompt should ideally prevent it.
    if (
      clueText.toLowerCase().includes(correctAnswer.toLowerCase()) &&
      // Only filter if the clue is *just* the answer or too similar.
      clueText.toLowerCase().length < correctAnswer.toLowerCase().length + 10
    ) {
      console.warn("AI generated a clue too close to the answer. Filtering.");
      return "The AI generated a clue too close to the answer. Try again or check previous clues.";
    }

    // Trim to maximum length to prevent overly long clues.
    return clueText.substring(0, MAX_CLUE_LENGTH);
  } catch (error) {
    console.error("Error generating clue with AI service:", error);
    return null; // Return null on error to indicate failure to generate a clue.
  }
}
