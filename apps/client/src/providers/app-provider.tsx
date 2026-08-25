import { contentBundle, worshipsById } from "@zekraneh/content";
import {
  DEFAULT_APP_SETTINGS,
  advanceSession,
  createSession,
  decrementCounter,
  incrementCounterAndAdvance,
  isSessionCompatible,
  moveSessionStep,
  resetCounter,
  resolveAndAdvance,
  type AppSettings,
  type PrayerSession,
  type PrayerDefinition,
  type WorshipCompletion,
} from "@zekraneh/domain";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { AppState } from "react-native";
import { SerialWriteQueue, ZekranehDatabase } from "@/data/database";

type AppStatus = "loading" | "ready" | "error";

interface AppContextValue {
  readonly status: AppStatus;
  readonly error: string | null;
  readonly settings: AppSettings;
  readonly session: PrayerSession | null;
  readonly completions: readonly WorshipCompletion[];
  readonly incompatibleSession: boolean;
  readonly startSession: (worshipId: string, modeId: string, replace?: boolean) => Promise<boolean>;
  readonly restartIncompatibleSession: () => Promise<void>;
  readonly increment: () => void;
  readonly decrement: () => void;
  readonly reset: () => void;
  readonly resolve: (resolution: "completed" | "skipped") => void;
  readonly navigateStep: (direction: "previous" | "next") => void;
  readonly updateSettings: (settings: AppSettings) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AppStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [database, setDatabase] = useState<ZekranehDatabase | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [session, setSession] = useState<PrayerSession | null>(null);
  const [completions, setCompletions] = useState<readonly WorshipCompletion[]>([]);
  const sessionRef = useRef<PrayerSession | null>(null);
  const [incompatibleSession, setIncompatibleSession] = useState(false);
  const queue = useMemo(() => new SerialWriteQueue(), []);

  useEffect(() => {
    let active = true;
    ZekranehDatabase.open(contentBundle)
      .then(async (opened) => {
        const [savedSettings, savedSession, savedCompletions] = await Promise.all([
          opened.loadSettings(),
          opened.loadActiveSession(),
          opened.loadCompletions(),
        ]);
        if (!active) return;
        const savedWorship = savedSession ? worshipsById.get(savedSession.prayerId) : undefined;
        const compatible = savedSession != null && savedWorship != null && isSessionCompatible(savedWorship, savedSession);
        const needsLegacyAdvance = compatible && savedSession.stepStates[savedSession.currentStepId]?.resolution != null;
        const activeSession = needsLegacyAdvance ? advanceSession(savedWorship, savedSession) : savedSession;
        let loadedCompletions = savedCompletions;
        if (needsLegacyAdvance) {
          if (activeSession) await opened.saveSession(activeSession);
          else {
            const completion = completionFromSession(savedSession, savedSession.updatedAt);
            await opened.completeSession(completion);
            loadedCompletions = [completion, ...savedCompletions];
          }
        }
        if (!active) return;
        setDatabase(opened);
        setSettings(savedSettings);
        setSession(activeSession);
        setCompletions(loadedCompletions);
        sessionRef.current = activeSession;
        const activeWorship = activeSession ? worshipsById.get(activeSession.prayerId) : undefined;
        setIncompatibleSession(activeSession != null && (!activeWorship || !isSessionCompatible(activeWorship, activeSession)));
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "راه‌اندازی پایگاه داده ناموفق بود");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") void queue.flush();
    });
    return () => subscription.remove();
  }, [queue]);

  const persist = useCallback((next: PrayerSession) => {
    if (!database) return;
    queue.enqueue(() => database.saveSession(next));
  }, [database, queue]);

  const mutate = useCallback((
    change: (worship: PrayerDefinition, current: PrayerSession) => PrayerSession | null,
    recordsCompletion = false,
  ) => {
    const current = sessionRef.current;
    if (!current || incompatibleSession) return;
    const worship = worshipsById.get(current.prayerId);
    if (!worship) return;
    try {
      const next = change(worship, current);
      sessionRef.current = next;
      setSession(next);
      if (next) persist(next);
      else if (database && recordsCompletion) {
        const completion = completionFromSession(current);
        setCompletions((previous) => [completion, ...previous]);
        queue.enqueue(() => database.completeSession(completion));
      } else if (database) queue.enqueue(() => database.clearActiveSession());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "به‌روزرسانی جلسه ناموفق بود");
    }
  }, [database, incompatibleSession, persist, queue]);

  const startSession = useCallback(async (worshipId: string, modeId: string, replace = false): Promise<boolean> => {
    if (!database) return false;
    if (sessionRef.current && !replace) return false;
    const worship = worshipsById.get(worshipId);
    if (!worship) return false;
    const next = createSession(worship, modeId);
    await queue.flush();
    await database.replaceActiveSession(next);
    sessionRef.current = next;
    setSession(next);
    setIncompatibleSession(false);
    return true;
  }, [database, queue]);

  const restartIncompatibleSession = useCallback(async () => {
    if (!database) return;
    await queue.flush();
    await database.clearActiveSession();
    sessionRef.current = null;
    setSession(null);
    setIncompatibleSession(false);
  }, [database, queue]);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    if (database) queue.enqueue(() => database.saveSettings(next));
  }, [database, queue]);

  const value = useMemo<AppContextValue>(() => ({
    status,
    error,
    settings,
    session,
    completions,
    incompatibleSession,
    startSession,
    restartIncompatibleSession,
    increment: () => mutate((worship, current) => incrementCounterAndAdvance(worship, current), true),
    decrement: () => mutate((worship, current) => decrementCounter(worship, current)),
    reset: () => mutate((worship, current) => resetCounter(worship, current)),
    resolve: (resolution) => mutate((worship, current) => resolveAndAdvance(worship, current, resolution), true),
    navigateStep: (direction) => mutate((worship, current) => moveSessionStep(worship, current, direction), true),
    updateSettings,
  }), [completions, error, incompatibleSession, mutate, restartIncompatibleSession, session, settings, startSession, status, updateSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function completionFromSession(session: PrayerSession, completedAt = new Date().toISOString()): WorshipCompletion {
  return {
    id: `completion-${session.id}`,
    worshipId: session.prayerId,
    modeId: session.modeId,
    completedAt,
  };
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp باید داخل AppProvider استفاده شود");
  return value;
}
