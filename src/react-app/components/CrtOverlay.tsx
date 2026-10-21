import { useBootSequence } from "@hooks/useBootSequence";
import useCrtPreferences from "@hooks/useCrtPreferences";
import useTypewriter from "@hooks/useTypewriter";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./CrtOverlay.module.css";

export const BANNER_TYPE_SPEED = 40;

function BootBanner({ onComplete }: { onComplete: () => void }) {
  const { displayedText, isComplete } = useTypewriter("VT220 OK", {
    speed: BANNER_TYPE_SPEED,
    onComplete,
  });

  return (
    <div className={styles.bootBanner}>
      <span className="sr-only">{"VT220 OK\nTerminal Quiz"}</span>
      <div aria-hidden="true">
        <span
          className={styles.bootBannerInverse}
          data-testid="boot-banner-line1"
        >
          {displayedText}
        </span>
        {isComplete && <div data-testid="boot-banner-line2">Terminal Quiz</div>}
      </div>
    </div>
  );
}

function CrtOverlay() {
  const { settings, presetLabel, cyclePreset, isFirstVisit } =
    useCrtPreferences();

  const isFullPreset = useMemo(() => presetLabel === "full", [presetLabel]);

  const { stage, onBannerTyped } = useBootSequence(settings.powerOn);
  const [flickerPulse, setFlickerPulse] = useState(false);
  const [firstVisitDone, setFirstVisitDone] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!settings.flicker) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let offTimer: ReturnType<typeof setTimeout> | undefined;
    const clearTimers = () => {
      if (timer) clearTimeout(timer);
      if (offTimer) clearTimeout(offTimer);
    };
    const stopPulse = () => {
      clearTimers();
      setFlickerPulse(false);
    };
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    const schedule = () => {
      const delay = 4000 + Math.random() * 5000;
      timer = setTimeout(() => {
        setFlickerPulse(true);
        offTimer = setTimeout(() => setFlickerPulse(false), 120);
        schedule();
      }, delay);
    };
    schedule();
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) stopPulse();
    };
    mql.addEventListener("change", onMotionChange);
    return () => {
      mql.removeEventListener("change", onMotionChange);
      stopPulse();
    };
  }, [settings.flicker]);

  useEffect(() => {
    if (!isFirstVisit) return;
    const timer = setTimeout(() => setFirstVisitDone(true), 5000);
    return () => clearTimeout(timer);
  }, [isFirstVisit]);

  /* Apply text glow + chromatic aberration to document root */
  useEffect(() => {
    const el = document.documentElement;
    const parts: string[] = [];

    if (settings.textGlow) {
      parts.push(
        "0 0 2px rgba(76,175,80,0.55)",
        "0 0 8px rgba(76,175,80,0.18)",
      );
    }
    if (settings.chromaticAberration) {
      parts.push(
        "1px 0 0 rgba(255,60,60,0.18)",
        "-1px 0 0 rgba(60,60,255,0.18)",
      );
    }
    const prev = el.style.textShadow;
    el.style.textShadow = parts.length > 0 ? parts.join(", ") : "";
    return () => {
      el.style.textShadow = prev;
    };
  }, [settings.textGlow, settings.chromaticAberration]);

  const handleStatusClick = useCallback(() => {
    cyclePreset();
    setFlashing(true);
  }, [cyclePreset]);

  const handleFlashEnd = useCallback(() => {
    setFlashing(false);
  }, []);

  const showHint = isFirstVisit && !firstVisitDone;
  const message = showHint
    ? `CRT: ${presetLabel}  [Ctrl+Shift+,]`
    : `CRT: ${presetLabel}`;

  const statusBar = (
    <button
      type="button"
      className={`${styles.statusBar} ${flashing ? styles.statusBarFlash : ""}`}
      onClick={handleStatusClick}
      onAnimationEnd={handleFlashEnd}
      data-testid="crt-status"
      title="Toggle CRT effect (Ctrl+Shift+,)"
    >
      {message}
    </button>
  );

  const booting = stage !== "done";

  const effectsActive = settings.scanlines || settings.glow || settings.powerOn;

  if (!effectsActive) {
    return statusBar;
  }

  const scanlinesClass = isFullPreset
    ? styles.scanlinesHeavy
    : styles.scanlines;

  const glowClass = isFullPreset ? styles.glowHeavy : styles.glow;

  const classNames = [
    styles.crtOverlay,
    settings.scanlines && scanlinesClass,
    settings.glow && glowClass,
    flickerPulse && styles.flickerPulse,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} data-testid="crt-overlay">
      {booting && (
        <div className={styles.bootLayer} data-testid="crt-poweron">
          {stage === "flash" && <div className={styles.bootFlash} />}
          <div className={styles.bootContent}>
            {stage === "cursor" && <div className={styles.bootCursor} />}
            {/* One slot for both stages, so the banner doesn't remount and
                retype when typing ends and `hold` begins. */}
            {(stage === "banner" || stage === "hold") && (
              <BootBanner onComplete={onBannerTyped} />
            )}
          </div>
        </div>
      )}
      {booting ? null : statusBar}
    </div>
  );
}

export default CrtOverlay;
