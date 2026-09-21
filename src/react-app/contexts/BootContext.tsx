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
};

// Fails open on purpose. Typed surfaces gate their *mount* on `bootComplete`,
// so a consumer rendered without a provider above it would otherwise deadlock
// the typing chain and leave the player staring at an empty question. With no
// provider, everything behaves as though boot already finished.
const BootContext = createContext<BootContextValue>({
  bootComplete: true,
  markBootComplete: () => {},
});

export function BootProvider({ children }: { children: ReactNode }) {
  const [bootComplete, setBootComplete] = useState(false);

  const markBootComplete = useCallback(() => setBootComplete(true), []);

  const value = useMemo(
    () => ({ bootComplete, markBootComplete }),
    [bootComplete, markBootComplete],
  );

  return <BootContext.Provider value={value}>{children}</BootContext.Provider>;
}

export function useBoot(): BootContextValue {
  return useContext(BootContext);
}

export default BootContext;
