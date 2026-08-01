import { useCallback, useEffect, useMemo, useState } from "react";

export interface CrtSettings {
  scanlines: boolean;
  glow: boolean;
  textGlow: boolean;
  chromaticAberration: boolean;
  flicker: boolean;
  powerOn: boolean;
}

const STORAGE_KEY = "terminal_quiz_crt_settings";

const PRESETS: CrtSettings[] = [
  {
    scanlines: false,
    glow: false,
    textGlow: false,
    chromaticAberration: false,
    flicker: false,
    powerOn: false,
  },
  {
    scanlines: true,
    glow: false,
    textGlow: false,
    chromaticAberration: false,
    flicker: false,
    powerOn: false,
  },
  {
    scanlines: true,
    glow: true,
    textGlow: true,
    chromaticAberration: false,
    flicker: false,
    powerOn: false,
  },
  {
    scanlines: true,
    glow: true,
    textGlow: true,
    chromaticAberration: true,
    flicker: true,
    powerOn: true,
  },
];

const PRESET_LABELS = ["off", "light", "medium", "full"] as const;

function normalizeSettings(raw: Partial<CrtSettings>): CrtSettings {
  return {
    scanlines: raw.scanlines ?? false,
    glow: raw.glow ?? false,
    textGlow: raw.textGlow ?? false,
    chromaticAberration: raw.chromaticAberration ?? false,
    flicker: raw.flicker ?? false,
    powerOn: raw.powerOn ?? false,
  };
}

function readSettings(): CrtSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeSettings(JSON.parse(raw));
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
    a.textGlow === b.textGlow &&
    a.chromaticAberration === b.chromaticAberration &&
    a.flicker === b.flicker &&
    a.powerOn === b.powerOn
  );
}

export default function useCrtPreferences() {
  const [settings, setSettingsState] = useState<CrtSettings>(
    () => readSettings() ?? PRESETS[3],
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
      const next = idx <= 0 ? PRESETS.length - 1 : idx - 1;
      return PRESETS[next];
    });
  }, []);

  const setSettings = useCallback((s: CrtSettings) => {
    setSettingsState(s);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "Comma") {
        e.preventDefault();
        cyclePreset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cyclePreset]);

  const [isFirstVisit] = useState(() => readSettings() === null);

  return {
    settings,
    presetLabel,
    cyclePreset,
    setSettings,
    isFirstVisit,
  };
}
