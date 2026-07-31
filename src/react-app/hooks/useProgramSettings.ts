import { useEffect, useState } from "react";

export function useProgramSettings(
  program: { name: string; visibility: string } | undefined,
) {
  const [programName, setProgramName] = useState("");
  const [programVisibility, setProgramVisibility] = useState("public");

  useEffect(() => {
    if (program) {
      setProgramName(program.name);
      setProgramVisibility(program.visibility);
    }
  }, [program]);

  return {
    programName,
    programVisibility,
    setProgramName,
    setProgramVisibility,
  };
}
