import useTypewriter from "@hooks/useTypewriter";
import { useCallback, useEffect, useRef, useState } from "react";

export const THE_END_TEXT = "The End";
// Deliberately slower than gameplay text. This is the terminal moment at the
// end of a program, not a line to get through.
export const THE_END_TYPE_SPEED = 120;

type ProgramEndingProps = {
  canType: boolean;
  resetError: string | null;
  isResetting: boolean;
  onSelectNewProgram: () => void;
  onPlayAgain: () => void;
};

function EndingHeading({ displayedText }: { displayedText: string }) {
  return (
    <h2>
      <span className="sr-only">{THE_END_TEXT}</span>
      <span aria-hidden="true" data-testid="the-end-heading">
        {displayedText}
      </span>
    </h2>
  );
}

// Mounted only once typing is cleared to start, for the same reason as every
// other typed surface: the hook resolves `enabled: false` to instant full
// text, so gating by that flag would flash the whole heading first.
function TypedHeading({ onComplete }: { onComplete: () => void }) {
  const { displayedText } = useTypewriter(THE_END_TEXT, {
    speed: THE_END_TYPE_SPEED,
    onComplete,
  });

  return <EndingHeading displayedText={displayedText} />;
}

// Rendered only while the program is finished, so unmounting on "play again"
// resets the reveal without an effect to clear it.
export default function ProgramEnding({
  canType,
  resetError,
  isResetting,
  onSelectNewProgram,
  onPlayAgain,
}: ProgramEndingProps) {
  const [headingTyped, setHeadingTyped] = useState(false);
  const handleHeadingComplete = useCallback(() => setHeadingTyped(true), []);
  const selectNewProgramRef = useRef<HTMLButtonElement>(null);

  // Keyed on the reveal rather than on mount: the buttons are not in the tree
  // until the heading finishes, so there is nothing to focus before then.
  useEffect(() => {
    if (!headingTyped) return;
    selectNewProgramRef.current?.focus();
  }, [headingTyped]);

  return (
    <div id="classic-ending">
      {canType ? (
        <TypedHeading onComplete={handleHeadingComplete} />
      ) : (
        <EndingHeading displayedText="" />
      )}
      {resetError && <p className="error-message">{resetError}</p>}
      {headingTyped && (
        <div className="action-buttons">
          <button
            ref={selectNewProgramRef}
            type="button"
            onClick={onSelectNewProgram}
            disabled={isResetting}
            title="Select new program"
          >
            Select new program
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            disabled={isResetting}
            title={isResetting ? "Restarting..." : "Play program again"}
          >
            {isResetting ? "Restarting..." : "Play program again"}
          </button>
        </div>
      )}
    </div>
  );
}
