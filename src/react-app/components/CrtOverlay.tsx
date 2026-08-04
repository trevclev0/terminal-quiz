import useCrtPreferences from "@hooks/useCrtPreferences";
import useTypewriter from "@hooks/useTypewriter";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./CrtOverlay.module.css";

const BOOT_STAGES = ["flash", "blackout", "cursor", "banner", "done"] as const;
type BootStage = (typeof BOOT_STAGES)[number];

export const BANNER_TYPE_SPEED = 40;
export const BANNER_PAUSE_MS = 500;
const BANNER_FALLBACK_MS = 4000;
const BOOT_CURSOR_MS = 800;
export const BOOT_BANNER_MS = 1850;

function BootBanner({ onComplete }: { onComplete: () => void }) {
  const { displayedText, isComplete } = useTypewriter("VT220 OK", {
    speed: BANNER_TYPE_SPEED,
    onComplete,
  });

  return (
    <div className={styles.bootBanner}>
      <span
        className={styles.bootBannerInverse}
        data-testid="boot-banner-line1"
      >
        {displayedText}
      </span>
      {isComplete && <div>Terminal Quiz</div>}
    </div>
  );
}

function CrtOverlay() {
  const { settings, presetLabel, cyclePreset, isFirstVisit } =
    useCrtPreferences();

  const isFullPreset = useMemo(() => presetLabel === "full", [presetLabel]);

  const [bootStage, setBootStage] = useState<BootStage>(
    settings.powerOn ? "flash" : "done",
  );
  const [flickerPulse, setFlickerPulse] = useState(false);
  const [firstVisitDone, setFirstVisitDone] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [bannerDone, setBannerDone] = useState(false);

  useEffect(() => {
    if (!settings.powerOn) {
      setBootStage("done");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBootStage("done");
      return;
    }
    setBannerDone(false);
    setBootStage("flash");
    const timers = [
      setTimeout(() => setBootStage("blackout"), 150),
      setTimeout(() => setBootStage("cursor"), BOOT_CURSOR_MS),
      setTimeout(() => setBootStage("banner"), BOOT_BANNER_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [settings.powerOn]);

  useEffect(() => {
    if (bootStage !== "banner") return;
    const timer = setTimeout(() => setBootStage("done"), BANNER_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [bootStage]);

  useEffect(() => {
    if (bootStage !== "banner" || !bannerDone) return;
    const timer = setTimeout(() => setBootStage("done"), BANNER_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [bootStage, bannerDone]);

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

  const booting = bootStage !== "done";

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
          {bootStage === "flash" && <div className={styles.bootFlash} />}
          <div className={styles.bootContent}>
            {bootStage === "cursor" && <div className={styles.bootCursor} />}
            {bootStage === "banner" && (
              <BootBanner onComplete={() => setBannerDone(true)} />
            )}
          </div>
        </div>
      )}
      {booting ? null : statusBar}
    </div>
  );
}

export default CrtOverlay;
