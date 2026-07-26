import useCrtPreferences from "@hooks/useCrtPreferences";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./CrtOverlay.module.css";

function CrtOverlay() {
  const { settings, presetLabel, cyclePreset, isFirstVisit } =
    useCrtPreferences();

  const isFullPreset = useMemo(() => presetLabel === "full", [presetLabel]);

  const [booted, setBooted] = useState(!settings.powerOn);
  const [firstVisitDone, setFirstVisitDone] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!settings.powerOn) {
      setBooted(true);
      return;
    }
    const timer = setTimeout(() => setBooted(true), 1000);
    return () => clearTimeout(timer);
  }, [settings.powerOn]);

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
      parts.push("0 0 2px rgba(0,255,0,0.4)", "0 0 8px rgba(0,255,0,0.2)");
    }
    if (settings.chromaticAberration) {
      parts.push("1px 0 0 rgba(255,0,0,0.35)", "-1px 0 0 rgba(0,0,255,0.35)");
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
    settings.flicker && styles.flicker,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} data-testid="crt-overlay">
      {!booted && (
        <div className={styles.powerOnLayer} data-testid="crt-poweron" />
      )}
      {statusBar}
    </div>
  );
}

export default CrtOverlay;
