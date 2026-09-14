import type { DayKey, DayPlan, Schedule, TimeWindow, UsageLog } from "./types";

export const DAY_KEYS: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
export const WEEKEND_KEYS: DayKey[] = ["sat", "sun"];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Montag",
  tue: "Dienstag",
  wed: "Mittwoch",
  thu: "Donnerstag",
  fri: "Freitag",
  sat: "Samstag",
  sun: "Sonntag",
};

export const DAY_SHORT_LABELS: Record<DayKey, string> = {
  mon: "Mo",
  tue: "Di",
  wed: "Mi",
  thu: "Do",
  fri: "Fr",
  sat: "Sa",
  sun: "So",
};

// Date.getDay(): 0 = Sonntag
const JS_DAY_TO_KEY: DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function dayKeyOf(date: Date): DayKey {
  return JS_DAY_TO_KEY[date.getDay()];
}

/** "07:30" -> 450. Wirft bei ungültiger Eingabe. */
export function parseTime(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error(`Ungültige Uhrzeit: "${value}" (erwartet HH:MM)`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) {
    throw new Error(`Ungültige Uhrzeit: "${value}"`);
  }
  return hours * 60 + minutes;
}

/** 450 -> "07:30". */
export function formatTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = Math.round(minutesFromMidnight % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Minuten seit Mitternacht, inkl. Sekundenbruchteil. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Lokaler Tagesschlüssel "YYYY-MM-DD" (nicht UTC — der Tag wechselt lokal). */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function usageKey(date: Date, windowIndex: number): string {
  return `${dateKey(date)}#${windowIndex}`;
}

export function usedMinutes(
  usage: UsageLog,
  date: Date,
  windowIndex: number
): number {
  return usage[usageKey(date, windowIndex)] ?? 0;
}

/** Datum am selben Tag mit gegebener Uhrzeit; 24:00 ergibt den Folgetag 00:00. */
export function atTime(day: Date, minutesFromMidnight: number): Date {
  const result = startOfDay(day);
  result.setMinutes(result.getMinutes() + minutesFromMidnight);
  return result;
}

export function findWindowAt(
  plan: DayPlan,
  minutes: number
): { window: TimeWindow; index: number } | null {
  for (let index = 0; index < plan.windows.length; index++) {
    const window = plan.windows[index];
    if (minutes >= parseTime(window.start) && minutes < parseTime(window.end)) {
      return { window, index };
    }
  }
  return null;
}

export type Evaluation =
  | {
      status: "allowed";
      window: TimeWindow;
      windowIndex: number;
      /** Verbleibende Minuten; null = unbegrenztes Fenster. */
      remainingMinutes: number | null;
      windowEndsAt: Date;
    }
  | {
      status: "blocked";
      reason: "outside_window" | "limit_reached";
      /** Nächster Zeitpunkt mit Freigabe, oder null wenn in 7 Tagen keiner kommt. */
      nextOpening: Date | null;
    };

/**
 * Kernregel: Ist die Nutzung jetzt erlaubt?
 *
 * Gesperrt ist, wer außerhalb jedes Fensters liegt oder das Budget des
 * aktuellen Fensters aufgebraucht hat.
 */
export function evaluate(
  schedule: Schedule,
  usage: UsageLog,
  now: Date
): Evaluation {
  const plan = schedule.days[dayKeyOf(now)];
  const current = plan ? findWindowAt(plan, minutesOfDay(now)) : null;

  if (!current) {
    return {
      status: "blocked",
      reason: "outside_window",
      nextOpening: findNextOpening(schedule, usage, now),
    };
  }

  const limit = current.window.limitMinutes;
  const windowEndsAt = atTime(now, parseTime(current.window.end));

  if (limit === null) {
    return {
      status: "allowed",
      window: current.window,
      windowIndex: current.index,
      remainingMinutes: null,
      windowEndsAt,
    };
  }

  const used = usedMinutes(usage, now, current.index);
  if (used >= limit) {
    return {
      status: "blocked",
      reason: "limit_reached",
      nextOpening: findNextOpening(schedule, usage, now),
    };
  }

  return {
    status: "allowed",
    window: current.window,
    windowIndex: current.index,
    remainingMinutes: limit - used,
    windowEndsAt,
  };
}

/** Sucht bis zu 7 Tage voraus das nächste Fenster, das noch Budget hat. */
export function findNextOpening(
  schedule: Schedule,
  usage: UsageLog,
  now: Date
): Date | null {
  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(startOfDay(now), offset);
    const plan = schedule.days[dayKeyOf(day)];
    if (!plan) continue;

    for (let index = 0; index < plan.windows.length; index++) {
      const window = plan.windows[index];
      const start = atTime(day, parseTime(window.start));
      const end = atTime(day, parseTime(window.end));

      // Bereits abgelaufene Fenster überspringen.
      if (end.getTime() <= now.getTime()) continue;

      // Fenster ohne Restbudget bringen keine Freigabe.
      if (window.limitMinutes !== null) {
        const used = usedMinutes(usage, day, index);
        if (used >= window.limitMinutes) continue;
      }

      return start.getTime() > now.getTime() ? start : new Date(now);
    }
  }
  return null;
}

/**
 * Prüft die Fenster eines Tages und gibt eine Fehlermeldung zurück,
 * oder null wenn alles passt.
 */
export function validateWindows(windows: TimeWindow[]): string | null {
  const parsed: Array<{ start: number; end: number }> = [];

  for (const window of windows) {
    let start: number;
    let end: number;
    try {
      start = parseTime(window.start);
      end = parseTime(window.end);
    } catch (error) {
      return error instanceof Error ? error.message : "Ungültige Uhrzeit";
    }
    if (start >= end) {
      return `"${window.start}–${window.end}": Das Ende muss nach dem Beginn liegen.`;
    }
    if (
      window.limitMinutes !== null &&
      (!Number.isFinite(window.limitMinutes) || window.limitMinutes < 0)
    ) {
      return `"${window.start}–${window.end}": Das Limit muss 0 oder größer sein.`;
    }
    parsed.push({ start, end });
  }

  const sorted = [...parsed].sort((a, b) => a.start - b.start);
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index].start < sorted[index - 1].end) {
      return "Zwei Zeitfenster überschneiden sich.";
    }
  }

  return null;
}

export function sortWindows(windows: TimeWindow[]): TimeWindow[] {
  return [...windows].sort((a, b) => parseTime(a.start) - parseTime(b.start));
}

export function isLocked(schedule: Schedule, now: Date): boolean {
  if (!schedule.lockedUntil) return false;
  const until = new Date(schedule.lockedUntil);
  return Number.isFinite(until.getTime()) && until.getTime() > now.getTime();
}

/** Alte Verbrauchsdaten entfernen, damit der Speicher nicht unbegrenzt wächst. */
export function pruneUsage(
  usage: UsageLog,
  now: Date,
  keepDays = 14
): UsageLog {
  const cutoff = dateKey(addDays(startOfDay(now), -keepDays));
  const result: UsageLog = {};
  for (const [key, value] of Object.entries(usage)) {
    if (key.slice(0, 10) >= cutoff) {
      result[key] = value;
    }
  }
  return result;
}

/** 92.4 -> "1 Std 32 Min", 32.4 -> "32 Min". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} Min`;
  if (rest === 0) return `${hours} Std`;
  return `${hours} Std ${rest} Min`;
}

/** Freigabezeitpunkt als "heute 20:00" / "morgen 07:00" / "Montag, 07:00". */
export function formatOpening(opening: Date, now: Date): string {
  const time = formatTime(minutesOfDay(opening));
  const dayDiff = Math.round(
    (startOfDay(opening).getTime() - startOfDay(now).getTime()) / 86400000
  );
  if (dayDiff <= 0) return `heute ${time}`;
  if (dayDiff === 1) return `morgen ${time}`;
  return `${DAY_LABELS[dayKeyOf(opening)]}, ${time}`;
}
