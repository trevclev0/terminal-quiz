import useCrtPreferences from "@hooks/useCrtPreferences";
import { useCallback, useEffect, useState } from "react";
import styles from "./CrtOverlay.module.css";

function CrtOverlay() {
  const { settings, presetLabel, cyclePreset, isFirstVisit } =
    useCrtPreferences();

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

  const handleStatusClick = useCallback(() => {
    cyclePreset();
    setFlashing(true);
  }, [cyclePreset]);

  const handleFlashEnd = useCallback(() => {
    setFlashing(false);
  }, []);

  const showHint = isFirstVisit && !firstVisitDone;
  const message = showHint
    ? `CRT: ${presetLabel}  [Ctrl+Shift+T]`
    : `CRT: ${presetLabel}`;

  const statusBar = (
    <button
      type="button"
      className={`${styles.statusBar} ${flashing ? styles.statusBarFlash : ""}`}
      onClick={handleStatusClick}
      onAnimationEnd={handleFlashEnd}
      data-testid="crt-status"
      title="Toggle CRT effect (Ctrl+Shift+T)"
    >
      {message}
    </button>
  );

  const effectsActive = settings.scanlines || settings.glow || settings.powerOn;

  if (!effectsActive) {
    return statusBar;
  }

  const classNames = [
    styles.crtOverlay,
    settings.scanlines && styles.scanlines,
    settings.glow && styles.glow,
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
