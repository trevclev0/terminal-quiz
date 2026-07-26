import { useCallback, useEffect, useMemo, useState } from "react";

export interface CrtSettings {
  scanlines: boolean;
  glow: boolean;
  flicker: boolean;
  powerOn: boolean;
}

const STORAGE_KEY = "terminal_quiz_crt_settings";

const PRESETS: CrtSettings[] = [
  { scanlines: false, glow: false, flicker: false, powerOn: false },
  { scanlines: true, glow: false, flicker: false, powerOn: false },
  { scanlines: true, glow: true, flicker: false, powerOn: false },
  { scanlines: true, glow: true, flicker: true, powerOn: true },
];

const PRESET_LABELS = ["off", "light", "medium", "full"] as const;

function readSettings(): CrtSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CrtSettings;
  } catch {}
  return null;
}

function writeSettings(settings: CrtSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function settingsMatch(a: CrtSettings, b: CrtSettings): boolean {
  return (
    a.scanlines === b.scanlines &&
    a.glow === b.glow &&
    a.flicker === b.flicker &&
    a.powerOn === b.powerOn
  );
}

export default function useCrtPreferences() {
  const [settings, setSettingsState] = useState<CrtSettings>(
    () => readSettings() ?? PRESETS[0],
  );

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  const presetIndex = useMemo(
    () => PRESETS.findIndex((p) => settingsMatch(p, settings)),
    [settings],
  );

  const presetLabel = presetIndex >= 0 ? PRESET_LABELS[presetIndex] : "custom";

  const cyclePreset = useCallback(() => {
    setSettingsState((prev) => {
      const idx = PRESETS.findIndex((p) => settingsMatch(p, prev));
      const next = (idx + 1) % PRESETS.length;
      return PRESETS[next];
    });
  }, []);

  const setSettings = useCallback((s: CrtSettings) => {
    setSettingsState(s);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        cyclePreset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cyclePreset]);

  const isFirstVisit = useMemo(() => readSettings() === null, []);

  return {
    settings,
    presetLabel,
    cyclePreset,
    setSettings,
    isFirstVisit,
  };
}
