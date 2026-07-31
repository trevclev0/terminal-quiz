import type { GateManagement } from "@api/queries/useProgramGatesQuery";
import type { GateForm } from "@components/manageEditorTypes";
import { useEffect, useState } from "react";

function gateToForm(gate: GateManagement): GateForm {
  return {
    label: gate.label,
    question: gate.question,
    correctAnswer: gate.correctAnswer,
    successMessage: gate.successMessage,
    acceptanceThreshold: gate.acceptanceThreshold,
    guidanceEnabled: gate.guidanceEnabled,
    guidanceThreshold: gate.guidanceThreshold,
  };
}

export function useGateDrafts(gates: GateManagement[] | undefined) {
  const [gateDrafts, setGateDrafts] = useState<Record<string, GateForm>>({});

  useEffect(() => {
    if (!gates) return;
    setGateDrafts((prev) => {
      const next = { ...prev };
      for (const gate of gates) {
        if (!next[gate.id]) {
          next[gate.id] = gateToForm(gate);
        }
      }
      for (const id of Object.keys(next)) {
        if (!gates.some((g) => g.id === id)) {
          delete next[id];
        }
      }
      return next;
    });
  }, [gates]);

  return [gateDrafts, setGateDrafts] as const;
}
