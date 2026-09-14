import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { evaluate, isLocked, pruneUsage, usageKey } from "./engine";
import {
  loadSchedule,
  loadUsage,
  saveSchedule,
  saveUsage,
} from "./storage";
import type { Evaluation } from "./engine";
import type { Schedule, UsageLog } from "./types";

const TICK_MS = 15_000;

/**
 * Sprünge über diese Dauer werden nicht angerechnet — sonst würde ein
 * Gerät, das im Standby war, beim Aufwachen das ganze Budget verbrennen.
 */
const MAX_ACCRUAL_MINUTES = 5;

export interface ScheduleGuard {
  ready: boolean;
  schedule: Schedule | null;
  evaluation: Evaluation | null;
  locked: boolean;
  now: Date;
  updateSchedule: (next: Schedule) => Promise<void>;
}

/**
 * Lädt den Zeitplan, bewertet ihn fortlaufend und rechnet verbrauchte Zeit
 * an, solange `tracking` gesetzt und die App im Vordergrund ist.
 */
export function useScheduleGuard(tracking: boolean): ScheduleGuard {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [usage, setUsage] = useState<UsageLog>({});
  const [now, setNow] = useState(() => new Date());
  const [ready, setReady] = useState(false);

  // Refs, damit die Anrechnung nicht bei jedem Render neu aufgesetzt wird.
  const usageRef = useRef<UsageLog>({});
  const scheduleRef = useRef<Schedule | null>(null);
  const lastAccrualRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [loadedSchedule, loadedUsage] = await Promise.all([
        loadSchedule(),
        loadUsage(),
      ]);
      if (cancelled) return;

      const pruned = pruneUsage(loadedUsage, new Date());
      scheduleRef.current = loadedSchedule;
      usageRef.current = pruned;
      setSchedule(loadedSchedule);
      setUsage(pruned);
      setNow(new Date());
      setReady(true);

      if (Object.keys(pruned).length !== Object.keys(loadedUsage).length) {
        void saveUsage(pruned);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Rechnet die seit dem letzten Aufruf vergangene Zeit dem aktuellen Fenster an. */
  const accrue = useCallback(() => {
    const last = lastAccrualRef.current;
    if (last === null) return;

    const nowMs = Date.now();
    lastAccrualRef.current = nowMs;

    const currentSchedule = scheduleRef.current;
    if (!currentSchedule) return;

    const elapsedMinutes = (nowMs - last) / 60_000;
    if (elapsedMinutes <= 0 || elapsedMinutes > MAX_ACCRUAL_MINUTES) return;

    const nowDate = new Date(nowMs);
    const result = evaluate(currentSchedule, usageRef.current, nowDate);

    // Unbegrenzte Fenster haben kein Budget, das verbraucht werden könnte.
    if (result.status !== "allowed" || result.remainingMinutes === null) return;

    const key = usageKey(nowDate, result.windowIndex);
    const next = {
      ...usageRef.current,
      [key]: (usageRef.current[key] ?? 0) + elapsedMinutes,
    };
    usageRef.current = next;
    setUsage(next);
    void saveUsage(next);
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!tracking) {
      accrue();
      lastAccrualRef.current = null;
      setNow(new Date());
      return;
    }

    lastAccrualRef.current = Date.now();
    setNow(new Date());

    const interval = setInterval(() => {
      accrue();
      setNow(new Date());
    }, TICK_MS);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Im Hintergrund vergangene Zeit zählt nicht.
        lastAccrualRef.current = Date.now();
        setNow(new Date());
      } else {
        accrue();
        lastAccrualRef.current = null;
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      accrue();
      lastAccrualRef.current = null;
    };
  }, [ready, tracking, accrue]);

  const updateSchedule = useCallback(async (next: Schedule) => {
    scheduleRef.current = next;
    setSchedule(next);
    setNow(new Date());
    await saveSchedule(next);
  }, []);

  const evaluation = useMemo(
    () => (schedule ? evaluate(schedule, usage, now) : null),
    [schedule, usage, now]
  );

  const locked = useMemo(
    () => (schedule ? isLocked(schedule, now) : false),
    [schedule, now]
  );

  return { ready, schedule, evaluation, locked, now, updateSchedule };
}
