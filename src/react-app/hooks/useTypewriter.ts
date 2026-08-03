import { useCallback, useEffect, useRef, useState } from "react";

export type TypewriterOptions = {
  enabled?: boolean;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
};

export type TypewriterResult = {
  displayedText: string;
  isComplete: boolean;
  skip: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useTypewriter(
  text: string,
  {
    enabled = true,
    speed = 30,
    startDelay = 0,
    onComplete,
  }: TypewriterOptions = {},
): TypewriterResult {
  const [displayedText, setDisplayedText] = useState<string>(() =>
    !enabled || prefersReducedMotion() || text === "" ? text : "",
  );
  const [isComplete, setIsComplete] = useState<boolean>(
    () => !enabled || prefersReducedMotion() || text === "",
  );

  const onCompleteRef = useRef(onComplete);
  const firedRef = useRef(false);
  const lastTextRef = useRef(text);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTypingTimers = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    setDisplayedText(text);
    setIsComplete(true);
    if (!firedRef.current) {
      firedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [text]);

  useEffect(() => {
    if (lastTextRef.current !== text) {
      lastTextRef.current = text;
      firedRef.current = false;
    }

    clearTypingTimers();

    if (!enabled || prefersReducedMotion() || text === "") {
      finish();
      return;
    }

    setDisplayedText("");
    setIsComplete(false);

    let index = 0;
    const tick = () => {
      index += 1;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearTypingTimers();
        finish();
      }
    };
    const startTyping = () => {
      intervalRef.current = setInterval(tick, speed);
    };

    if (startDelay > 0) {
      delayTimerRef.current = setTimeout(startTyping, startDelay);
    } else {
      startTyping();
    }

    return clearTypingTimers;
  }, [text, enabled, speed, startDelay, clearTypingTimers, finish]);

  const skip = useCallback(() => {
    clearTypingTimers();
    finish();
  }, [clearTypingTimers, finish]);

  return { displayedText, isComplete, skip };
}

export default useTypewriter;
