import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import useShake from "@hooks/useShake";
import { useEffect, useState } from "react";

type UseProgramPlayProps = {
  programId: string;
  currentGateId: string | null | undefined;
};

function useProgramPlay({ programId, currentGateId }: UseProgramPlayProps) {
  const submitGuessMutation = useSubmitGuessMutation(programId);

  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { isShaking, shake, clearShake } = useShake();

  // Clear response message and shake when currentGate.id changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clearShake is stable from useShake, only re-run when currentGateId changes
  useEffect(() => {
    setMessage(null);
    clearShake();
  }, [currentGateId]);

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage(null);

    try {
      const result = await submitGuessMutation.mutateAsync({
        gateId: currentGateId ?? "",
        guess,
      });

      if (result.success) {
        setMessage("Access Granted.");
        setGuess("");
      } else {
        setMessage("Access Denied.");
        shake();
      }
    } catch {
      setMessage("Error submitting guess");
    }
  };

  return {
    guess,
    message,
    isShaking,
    isPending: submitGuessMutation.isPending,
    changeHandler,
    handleSubmit,
  };
}

export default useProgramPlay;
