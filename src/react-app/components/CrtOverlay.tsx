import useCrtPreferences from "@hooks/useCrtPreferences";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./CrtOverlay.module.css";

const BOOT_STAGES = ["flash", "blackout", "cursor", "banner", "done"] as const;
type BootStage = (typeof BOOT_STAGES)[number];

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

  useEffect(() => {
    if (!settings.powerOn) {
      setBootStage("done");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBootStage("done");
      return;
    }
    setBootStage("flash");
    const timers = [
      setTimeout(() => setBootStage("blackout"), 150),
      setTimeout(() => setBootStage("cursor"), 500),
      setTimeout(() => setBootStage("banner"), 1100),
      setTimeout(() => setBootStage("done"), 1750),
    ];
    return () => timers.forEach(clearTimeout);
  }, [settings.powerOn]);

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
              <div className={styles.bootBanner}>
                <span className={styles.bootBannerInverse}>VT220 OK</span>
                <div>Terminal Quiz</div>
              </div>
            )}
          </div>
        </div>
      )}
      {booting ? null : statusBar}
    </div>
  );
}

export default CrtOverlay;
