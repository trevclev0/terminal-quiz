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
          <div className="prompt-line">
            <span className="prompt-caret" aria-hidden="true">
              {gate.correctAnswer ? "✔" : ">"}
            </span>
            <input
              type="text"
              aria-label={gate.question}
              placeholder="Password entered correctly"
              value={gate.correctAnswer ? gate.correctAnswer : ""}
              disabled
              readOnly
            />
          </div>
          <p className="clue">{gate.successMessage}</p>
        </form>
      </details>
    </div>
  );
}
