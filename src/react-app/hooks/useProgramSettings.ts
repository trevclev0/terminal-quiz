import { useEffect, useState } from "react";

export function useProgramSettings(
  program: { name: string; visibility: string } | undefined,
) {
  const [programName, setProgramName] = useState("");
  const [programVisibility, setProgramVisibility] = useState("public");

  const name = program?.name;
  const visibility = program?.visibility;

  useEffect(() => {
    // Stryker disable next-line LogicalOperator,ConditionalExpression: `name`
    // and `visibility` come from one object, so both are undefined together
    // or neither is; either half of the guard alone behaves the same.
    if (name === undefined || visibility === undefined) return;
    setProgramName(name);
    setProgramVisibility(visibility);
  }, [name, visibility]);

  return {
    programName,
    programVisibility,
    setProgramName,
    setProgramVisibility,
  };
}
