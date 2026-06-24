import type { CompletedGate as CompletedGateType } from "@api/queries/useProgramProgressionQuery";

type CompletedGateProps = {
  id: string;
  gate: CompletedGateType;
};

export default function CompletedGate({ id, gate }: CompletedGateProps) {
  return (
    <div id={id} className="gate">
      <details open>
        <summary>{gate.label}</summary>
        <form aria-label={`${gate.label} - completed`}>
          <p className="description">{gate.question}</p>
          <input
            type="text"
            placeholder="Password entered correctly"
            value={`✔ ${gate.correctAnswer}`}
            disabled
          />
          <p className="clue">{gate.successMessage}</p>
        </form>
      </details>
    </div>
  );
}
