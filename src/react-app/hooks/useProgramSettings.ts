import { useEffect, useState } from "react";

export function useProgramSettings(
  program: { name: string; visibility: string } | undefined,
) {
  const [programName, setProgramName] = useState("");
  const [programVisibility, setProgramVisibility] = useState("public");

  const name = program?.name;
  const visibility = program?.visibility;

  useEffect(() => {
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
