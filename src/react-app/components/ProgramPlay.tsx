import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useProgramQuery } from "@api/queries/useProgramQuery";
import { PROGRAM_KEYS } from "@api/queryKeys";
import ActiveGate from "@components/ActiveGate";
import CompletedGate from "@components/CompletedGate";
import ConfirmDialog from "@components/ConfirmDialog";
import { GateProgress } from "@components/GateProgress";
import LoadingScreen from "@components/LoadingScreen";
import ProgramEnding from "@components/ProgramEnding";
import { ShortcutHelpDialog } from "@components/ShortcutHelpDialog";
import { useBoot } from "@contexts/BootContext";
import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts";
import useProgramPlay, { type Solve } from "@hooks/useProgramPlay";
import useProgressionScroll from "@hooks/useProgressionScroll";
import { Route } from "@routes/programs/$programId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { prefersReducedMotion } from "@utils/prefersReducedMotion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./ProgramPlay.module.css";

function ProgramPlay() {
  const { programId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();

  // Set once a confirmed reset is on its way out of this page. It disables
  // the progression query so nothing on this still-mounted page can refetch
  // (and so start the next run's clock) while the progression cache is removed.
  const [isLeaving, setIsLeaving] = useState(false);
  // "Play again" spans the reset and the refetch that follows it; the
  // mutation's isPending covers only the reset, so the buttons would
  // re-enable for a round trip before the new run loads.
  const [isRestarting, setIsRestarting] = useState(false);

  const { data: progression, isLoading } = useQuery({
    ...programProgressionQueryOptions(programId),
    enabled: !isLeaving,
  });

  const { data: program } = useProgramQuery(programId);

  const { bootComplete } = useBoot();

  const currentGate = progression?.currentGate ?? null;
  const completedGates = progression?.completedGates ?? [];

  const isTheEnd = currentGate === null;

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const openHelp = useCallback(() => setIsHelpOpen(true), []);

  const {
    guess,
    message,
    guessSucceeded,
    isShaking,
    isPending,
    changeHandler,
    handleSubmit,
    canRequestClue,
    isClueLimitReached,
    cooldownSeconds,
    handleRequestClue,
    clues,
    requestClueMutation,
    resetSessionMutation,
    lastSolve,
  } = useProgramPlay({
    programId,
    currentGateId: currentGate?.id,
    onHelpCommand: openHelp,
  });

  // The ACCESS GRANTED flash (#313) plays on the gate a live guess just
  // solved, never on gates that loaded solved. Reduced motion is read once
  // here so the flash and the hold on The End below agree on it.
  const [reduceMotion] = useState(prefersReducedMotion);
  const flashSolve = reduceMotion ? null : lastSolve;
  // Compared by identity: a replay can solve the same gate id again.
  const [flashedSolve, setFlashedSolve] = useState<Solve | null>(null);
  const handleFlashComplete = useCallback(
    () => setFlashedSolve(flashSolve),
    [flashSolve],
  );
  // On the last gate The End follows straight away, so its typing waits for
  // the flash the way a next question waits for the success message.
  const isFlashPending = flashSolve !== null && flashedSolve !== flashSolve;

  // Tracks which gate's question has been "released" by its predecessor's
  // successMessage finishing typing. Derived at render time (not reset via
  // an effect) so a gate transition gates the new question immediately —
  // an effect-based reset would lag one frame and flash the full text.
  const [releasedGateId, setReleasedGateId] = useState<string | null>(null);

  const handleSuccessMessageComplete = useCallback(() => {
    setReleasedGateId(currentGate?.id ?? null);
  }, [currentGate?.id]);

  // Boot gates the head of the typing chain, whichever surface that turns out
  // to be on this mount: the first question on a fresh start, or the last
  // completed gate's successMessage on a mid-program reload. Everything
  // downstream is already sequenced by `releasedGateId`, so holding the head
  // is enough to keep the boot banner from typing over gameplay text.
  const canTypeQuestion =
    bootComplete &&
    (completedGates.length === 0 || releasedGateId === currentGate?.id);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useKeyboardShortcuts([
    {
      key: "?",
      onKey: () => setIsHelpOpen((open) => !open),
      // The loading screen has no gate to explain, and a dialog opened over
      // it would pop up as soon as loading finishes.
      enabled: !isConfirmOpen && !isLoading && !isLeaving,
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  // Read inside the focus effect without being one of its triggers: closing
  // a dialog already restores focus itself. Synced in a layout effect (not
  // render) so it is committed before the passive focus effect below reads it.
  const isDialogOpenRef = useRef(false);
  useLayoutEffect(() => {
    isDialogOpenRef.current = isConfirmOpen || isHelpOpen;
  });
  const isCluePending = requestClueMutation.isPending;

  const programName = program?.name ?? programId;

  // Calculate next gate index for scrolling
  const nextGateIndex = isTheEnd ? -1 : completedGates.length;
  useProgressionScroll(nextGateIndex);

  // Auto-focus the active gate's input on mount and when currentGate.id
  // changes. A clue request disables the input, which drops focus, so the
  // pending flag is a trigger too: focus returns when the request settles.
  useEffect(() => {
    if (isDialogOpenRef.current) return;
    if (currentGate?.id && !isPending && !isCluePending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentGate?.id, isPending, isCluePending]);

  if (isLoading || isLeaving) {
    return <LoadingScreen message="Loading Program..." />;
  }

  const handleSelectNewProgram = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmReset = async () => {
    setResetError(null);
    try {
      const success = await resetSessionMutation.mutateAsync({ programId });
      if (!success) {
        setResetError("Failed to reset progress. Please try again.");
        return;
      }
      setIsConfirmOpen(false);
      // No progression refetch before leaving: the server starts the next
      // run's clock on the first fetch after a reset, and the time away
      // must not count. Remove (not just invalidate) the cached completed
      // payload so returning refetches instead of flashing "The End".
      setIsLeaving(true);
      await navigate({ to: "/programs/select" });
      queryClient.removeQueries({
        queryKey: PROGRAM_KEYS.progression(programId),
      });
    } catch (error) {
      console.error(error);
      setIsLeaving(false);
      setResetError("Failed to reset progress. Please try again.");
    }
  };

  const handleKeepProgress = () => {
    setIsConfirmOpen(false);
    navigate({ to: "/programs/select" });
  };

  const handleCancelReset = () => {
    setIsConfirmOpen(false);
  };

  const handlePlayAgain = async () => {
    setResetError(null);
    setIsRestarting(true);
    try {
      const success = await resetSessionMutation.mutateAsync({ programId });
      if (!success) {
        setResetError("Failed to reset progress. Please try again.");
        return;
      }
      // The reset only marks progression stale (see useResetSession), so
      // fetch it now: this fetch starts the new run's clock.
      await queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.progression(programId),
      });
    } catch (error) {
      console.error(error);
      setResetError("Failed to reset progress. Please try again.");
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>{programName}</h1>
      {progression && (
        <GateProgress
          completed={completedGates.length}
          total={progression.totalGates}
        />
      )}
      {completedGates.map((gate, index) => (
        <CompletedGate
          key={gate.id}
          id={`gate-${index}`}
          gate={gate}
          isLast={index === completedGates.length - 1 && !!currentGate}
          canType={bootComplete}
          onComplete={
            index === completedGates.length - 1 && currentGate
              ? handleSuccessMessageComplete
              : undefined
          }
          flash={flashSolve?.gateId === gate.id}
          onFlashComplete={handleFlashComplete}
        />
      ))}
      {currentGate && (
        <ActiveGate
          key={currentGate.id}
          id={`gate-${completedGates.length}`}
          gate={currentGate}
          guess={guess}
          message={message}
          guessSucceeded={guessSucceeded}
          isShaking={isShaking}
          isPending={isPending}
          inputRef={inputRef}
          changeHandler={changeHandler}
          handleSubmit={handleSubmit}
          canRequestClue={canRequestClue}
          isClueLimitReached={isClueLimitReached}
          cooldownSeconds={cooldownSeconds}
          handleRequestClue={handleRequestClue}
          clues={clues}
          requestClueMutation={requestClueMutation}
          enabled={canTypeQuestion}
        />
      )}
      {isTheEnd && (
        <ProgramEnding
          canType={bootComplete && !isFlashPending}
          resetError={resetError}
          isResetting={resetSessionMutation.isPending || isRestarting}
          shortcutsEnabled={!isConfirmOpen && !isHelpOpen}
          stats={progression?.stats ?? null}
          onSelectNewProgram={handleSelectNewProgram}
          onPlayAgain={handlePlayAgain}
        />
      )}
      {isConfirmOpen && (
        <ConfirmDialog
          ariaLabel="Reset Progress Confirmation"
          message={`Reset your progress on "${programName}" before selecting a new one?`}
          confirmLabel="Reset Progress"
          onConfirm={handleConfirmReset}
          secondaryLabel="Keep Progress"
          onSecondary={handleKeepProgress}
          onCancel={handleCancelReset}
          errorMessage={resetError}
        />
      )}
      {isHelpOpen && (
        <ShortcutHelpDialog onClose={() => setIsHelpOpen(false)} />
      )}
    </>
  );
}

export default ProgramPlay;
