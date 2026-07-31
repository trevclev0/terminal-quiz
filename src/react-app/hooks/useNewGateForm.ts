import type { NewGateForm } from "@components/AddGateForm";
import { useState } from "react";

const EMPTY_NEW_GATE: NewGateForm = {
  label: "",
  question: "",
  correctAnswer: "",
  successMessage: "",
};

export function useNewGateForm() {
  const [newGate, setNewGate] = useState<NewGateForm>(EMPTY_NEW_GATE);

  const onNewGateChange = (patch: Partial<NewGateForm>) => {
    setNewGate((prev) => ({ ...prev, ...patch }));
  };

  const resetNewGate = () => {
    setNewGate(EMPTY_NEW_GATE);
  };

  return { newGate, onNewGateChange, resetNewGate };
}
