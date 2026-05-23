import type { Gate } from "@shared/types";

function getGatesToRender(gates: Gate[]) {
  const nextGateIndex = gates.findIndex((r) => !r.isSolved);
  const gatesToRender =
    nextGateIndex === -1 ? gates : gates.slice(0, nextGateIndex + 1);

  return { gatesToRender, nextGateIndex };
}

export default getGatesToRender;
