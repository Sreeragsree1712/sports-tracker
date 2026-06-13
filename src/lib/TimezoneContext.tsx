import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { detectDefault, humanLabel, loadStored, shortAbbr, storeChoice } from './tz';

interface TimezoneCtx {
  tz: string;
  label: string;
  abbr: string;
  setTz: (tz: string) => void;
}

const Context = createContext<TimezoneCtx | null>(null);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [tz, setTzState] = useState<string>(() => loadStored() ?? detectDefault());

  const setTz = useCallback((next: string) => {
    setTzState(next);
    storeChoice(next);
  }, []);

  // Re-broadcast across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sports-tracker:tz' && e.newValue) {
        setTzState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<TimezoneCtx>(
    () => ({
      tz,
      label: humanLabel(tz),
      abbr: shortAbbr(tz),
      setTz,
    }),
    [tz, setTz],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTimezone(): TimezoneCtx {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useTimezone must be used inside <TimezoneProvider>');
  }
  return ctx;
}
