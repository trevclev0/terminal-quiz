import type { Gate } from "../db/types";

function getRiddlesToRender(riddles: Gate[]) {
  const nextRiddleIndex = riddles.findIndex((r) => !r.isSolved);
  const riddlesToRender =
    nextRiddleIndex === -1 ? riddles : riddles.slice(0, nextRiddleIndex + 1);

  return { riddlesToRender, nextRiddleIndex };
}

export default getRiddlesToRender;
