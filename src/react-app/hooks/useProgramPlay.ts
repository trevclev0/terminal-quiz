import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import { useEffect, useState } from "react";

type UseProgramPlayProps = {
  programId: string;
  currentGateId: string | null | undefined;
};

function useProgramPlay({ programId, currentGateId }: UseProgramPlayProps) {
  const submitGuessMutation = useSubmitGuessMutation(programId);

  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const shake = () => setIsShaking(true);

  // Clear response message and shake when currentGate.id changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: State setters are stable, but we need to re-run when currentGateId changes
  useEffect(() => {
    setMessage(null);
    setIsShaking(false);
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

  // Auto-clear shake animation after 400ms
  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  return {
    guess,
    message,
    isShaking,
    changeHandler,
    handleSubmit,
  };
}

export default useProgramPlay;
