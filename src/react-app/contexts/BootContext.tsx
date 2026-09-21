import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type BootContextValue = {
  bootComplete: boolean;
  markBootComplete: () => void;
  resetBoot: () => void;
};

// Fails open on purpose. Typed surfaces gate their *mount* on `bootComplete`,
// so a consumer rendered without a provider above it would otherwise deadlock
// the typing chain and leave the player staring at an empty question. With no
// provider, everything behaves as though boot already finished.
const BootContext = createContext<BootContextValue>({
  bootComplete: true,
  markBootComplete: () => {},
  resetBoot: () => {},
});

export function BootProvider({ children }: { children: ReactNode }) {
  const [bootComplete, setBootComplete] = useState(false);

  const markBootComplete = useCallback(() => setBootComplete(true), []);

  // The boot sequence can replay — cycling the CRT preset back to one with
  // powerOn re-runs it. Without re-gating, a gate entered during the replay
  // types behind the overlay, which is the race this whole flag exists for.
  const resetBoot = useCallback(() => setBootComplete(false), []);

  const value = useMemo(
    () => ({ bootComplete, markBootComplete, resetBoot }),
    [bootComplete, markBootComplete, resetBoot],
  );

  return <BootContext.Provider value={value}>{children}</BootContext.Provider>;
}

export function useBoot(): BootContextValue {
  return useContext(BootContext);
}

export default BootContext;
