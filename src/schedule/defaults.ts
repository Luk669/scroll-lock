import { DAY_KEYS, WEEKEND_KEYS } from "./engine";
import type { DayKey, DayPlan, Schedule } from "./types";

/** Unter der Woche: tagsüber 45 Minuten, abends bis 23 Uhr unbegrenzt. */
function weekdayPlan(): DayPlan {
  return {
    windows: [
      { start: "07:00", end: "20:00", limitMinutes: 45 },
      { start: "20:00", end: "23:00", limitMinutes: null },
    ],
  };
}

/** Wochenende: 09:00–23:00 ohne Limit. */
function weekendPlan(): DayPlan {
  return {
    windows: [{ start: "09:00", end: "23:00", limitMinutes: null }],
  };
}

export function createDefaultSchedule(): Schedule {
  const days = {} as Record<DayKey, DayPlan>;
  for (const key of DAY_KEYS) {
    days[key] = WEEKEND_KEYS.includes(key) ? weekendPlan() : weekdayPlan();
  }
  return { days, lockedUntil: null };
}
