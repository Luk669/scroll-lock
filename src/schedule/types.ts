/** Wochentage. Schlüssel bleiben stabil, Anzeigenamen siehe engine.ts. */
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/**
 * Ein Zeitfenster innerhalb eines Tages, z. B. "07:00–20:00, 45 Minuten".
 * Zeiten sind lokale Uhrzeiten im Format "HH:MM"; "24:00" ist als Ende
 * erlaubt und meint Mitternacht.
 */
export interface TimeWindow {
  /** Beginn, inklusive. */
  start: string;
  /** Ende, exklusive. */
  end: string;
  /** Erlaubte Nutzungsminuten in diesem Fenster; null = unbegrenzt. */
  limitMinutes: number | null;
}

/**
 * Der Plan eines Wochentags. Zeiten, die von keinem Fenster abgedeckt sind,
 * gelten als gesperrt — ein Tag mit leerer Liste ist also komplett gesperrt.
 */
export interface DayPlan {
  windows: TimeWindow[];
}

export interface Schedule {
  days: Record<DayKey, DayPlan>;
  /**
   * ISO-Zeitstempel. Solange er in der Zukunft liegt, lässt sich der
   * Zeitplan nicht ändern (Prüfungsphase o. Ä.).
   */
  lockedUntil: string | null;
}

/**
 * Verbrauchte Minuten je Tag und Fenster.
 * Schlüsselformat: `YYYY-MM-DD#<fensterIndex>`.
 */
export type UsageLog = Record<string, number>;
