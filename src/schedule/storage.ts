import AsyncStorage from "@react-native-async-storage/async-storage";

import { createDefaultSchedule } from "./defaults";
import { DAY_KEYS } from "./engine";
import type { Schedule, UsageLog } from "./types";

const SCHEDULE_KEY = "scrolllock:schedule:v1";
const USAGE_KEY = "scrolllock:usage:v1";

/**
 * Prüft grob, ob geladene Daten die erwartete Form haben. Defekte oder
 * veraltete Daten führen zum Standardplan statt zu einem Absturz.
 */
function isSchedule(value: unknown): value is Schedule {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Schedule;
  if (typeof candidate.days !== "object" || candidate.days === null) {
    return false;
  }
  return DAY_KEYS.every((key) => Array.isArray(candidate.days[key]?.windows));
}

export async function loadSchedule(): Promise<Schedule> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULE_KEY);
    if (!raw) return createDefaultSchedule();
    const parsed: unknown = JSON.parse(raw);
    return isSchedule(parsed) ? parsed : createDefaultSchedule();
  } catch {
    return createDefaultSchedule();
  }
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  } catch {
    // Schreibfehler dürfen die App nicht abbrechen; beim nächsten Tick
    // wird es erneut versucht.
  }
}

export async function loadUsage(): Promise<UsageLog> {
  try {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: UsageLog = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function saveUsage(usage: UsageLog): Promise<void> {
  try {
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {
    // siehe saveSchedule
  }
}
