import { useSubmitGuessMutation } from "@api/mutations/useSubmitGuessMutation";
import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Route } from "../routes/programs/$programId";

function ProgramPlay() {
  const { programId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: progression, isLoading } = useQuery(
    programProgressionQueryOptions(programId),
  );

  const submitGuessMutation = useSubmitGuessMutation(programId);

  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const selectNewProgramRef = useRef<HTMLButtonElement>(null);

  const currentGate = progression?.currentGate ?? null;
  const completedGates = progression?.completedGates ?? [];

  const isTheEnd = currentGate === null;

  useEffect(() => {
    if (isTheEnd) {
      selectNewProgramRef.current?.focus();
    }
  }, [isTheEnd]);

  if (isLoading) {
    return <h2 className="loading-screen">Loading Program...</h2>;
  }

  const handleSelectNewProgram = () => {
    navigate({
      to: "/programs/select",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGate) return;

    setMessage(null);

    try {
      const result = await submitGuessMutation.mutateAsync({
        gateId: currentGate.id,
        guess,
      });

      if (result.success) {
        setMessage(result.message ?? "Correct!");
        setGuess("");
      } else {
        setMessage(result.message ?? "Incorrect");
      }
    } catch {
      setMessage("Error submitting guess");
    }
  };

  return (
    <>
      <h1 className="title">Program: {programId}</h1>
      {completedGates.map((gate) => (
        <div key={gate.id} className="gate completed">
          <h3>{gate.label}</h3>
          <p>{gate.question}</p>
          <p className="success">{gate.successMessage}</p>
        </div>
      ))}
      {currentGate && (
        <div className="gate active">
          <h3>{currentGate.label}</h3>
          <p>{currentGate.question}</p>
          {message && <p className="message">{message}</p>}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={submitGuessMutation.isPending}
            />
            <button type="submit" disabled={submitGuessMutation.isPending}>
              Submit
            </button>
          </form>
        </div>
      )}
      {isTheEnd && (
        <div id="classic-ending">
          <h2>The End</h2>
          <div className="action-buttons">
            <button
              type="button"
              disabled
              title="Restarting isn't available yet"
            >
              Play program again
            </button>
            <button
              ref={selectNewProgramRef}
              type="button"
              onClick={handleSelectNewProgram}
            >
              Select new program
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProgramPlay;
