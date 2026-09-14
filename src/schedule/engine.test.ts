import assert from "node:assert/strict";
import { test } from "node:test";

import { createDefaultSchedule } from "./defaults";
import {
  evaluate,
  formatDuration,
  formatOpening,
  isLocked,
  pruneUsage,
  usageKey,
  validateWindows,
} from "./engine";
import type { Schedule } from "./types";

// 2026-09-14 ist ein Montag, 2026-09-19 ein Samstag.
const MONDAY_10H = new Date(2026, 8, 14, 10, 0, 0);
const MONDAY_21H = new Date(2026, 8, 14, 21, 0, 0);
const MONDAY_23H30 = new Date(2026, 8, 14, 23, 30, 0);
const SATURDAY_10H = new Date(2026, 8, 19, 10, 0, 0);

test("werktags im Limitfenster: erlaubt mit Restbudget", () => {
  const result = evaluate(createDefaultSchedule(), {}, MONDAY_10H);
  assert.equal(result.status, "allowed");
  assert.equal(result.status === "allowed" && result.remainingMinutes, 45);
});

test("aufgebrauchtes Budget sperrt und verweist aufs Abendfenster", () => {
  const usage = { [usageKey(MONDAY_10H, 0)]: 45 };
  const result = evaluate(createDefaultSchedule(), usage, MONDAY_10H);
  assert.equal(result.status, "blocked");
  assert.equal(result.status === "blocked" && result.reason, "limit_reached");
  assert.equal(
    result.status === "blocked" && formatOpening(result.nextOpening!, MONDAY_10H),
    "heute 20:00"
  );
});

test("teilweise verbrauchtes Budget bleibt erlaubt", () => {
  const usage = { [usageKey(MONDAY_10H, 0)]: 30.5 };
  const result = evaluate(createDefaultSchedule(), usage, MONDAY_10H);
  assert.equal(result.status, "allowed");
  assert.equal(result.status === "allowed" && result.remainingMinutes, 14.5);
});

test("Abendfenster ist unbegrenzt", () => {
  const result = evaluate(createDefaultSchedule(), {}, MONDAY_21H);
  assert.equal(result.status, "allowed");
  assert.equal(result.status === "allowed" && result.remainingMinutes, null);
});

test("nach 23 Uhr gesperrt bis zum nächsten Morgen", () => {
  const result = evaluate(createDefaultSchedule(), {}, MONDAY_23H30);
  assert.equal(result.status, "blocked");
  assert.equal(result.status === "blocked" && result.reason, "outside_window");
  assert.equal(
    result.status === "blocked" &&
      formatOpening(result.nextOpening!, MONDAY_23H30),
    "morgen 07:00"
  );
});

test("Wochenende nutzt den eigenen Plan", () => {
  const result = evaluate(createDefaultSchedule(), {}, SATURDAY_10H);
  assert.equal(result.status, "allowed");
  assert.equal(result.status === "allowed" && result.remainingMinutes, null);
});

test("Tag ohne Fenster ist komplett gesperrt", () => {
  const schedule = createDefaultSchedule();
  for (const key of Object.keys(schedule.days) as Array<
    keyof Schedule["days"]
  >) {
    schedule.days[key] = { windows: [] };
  }
  const result = evaluate(schedule, {}, MONDAY_10H);
  assert.equal(result.status, "blocked");
  assert.equal(result.status === "blocked" && result.nextOpening, null);
});

test("Sperre gilt nur solange der Zeitpunkt in der Zukunft liegt", () => {
  const schedule = createDefaultSchedule();
  schedule.lockedUntil = new Date(2026, 8, 20).toISOString();
  assert.equal(isLocked(schedule, MONDAY_10H), true);
  assert.equal(isLocked(schedule, new Date(2026, 8, 21)), false);
  schedule.lockedUntil = null;
  assert.equal(isLocked(schedule, MONDAY_10H), false);
});

test("Validierung erkennt Überschneidungen und verdrehte Zeiten", () => {
  assert.equal(
    validateWindows([
      { start: "07:00", end: "12:00", limitMinutes: 45 },
      { start: "11:00", end: "14:00", limitMinutes: null },
    ]),
    "Zwei Zeitfenster überschneiden sich."
  );
  assert.match(
    validateWindows([{ start: "20:00", end: "08:00", limitMinutes: null }])!,
    /Ende muss nach dem Beginn/
  );
  assert.equal(
    validateWindows([
      { start: "07:00", end: "20:00", limitMinutes: 45 },
      { start: "20:00", end: "23:00", limitMinutes: null },
    ]),
    null
  );
  assert.equal(validateWindows([]), null);
});

test("alte Verbrauchsdaten werden verworfen", () => {
  const usage = {
    "2026-09-14#0": 10,
    "2026-08-01#0": 99,
  };
  const pruned = pruneUsage(usage, MONDAY_10H);
  assert.deepEqual(pruned, { "2026-09-14#0": 10 });
});

test("Dauer wird lesbar formatiert", () => {
  assert.equal(formatDuration(32.4), "32 Min");
  assert.equal(formatDuration(92.4), "1 Std 32 Min");
  assert.equal(formatDuration(120), "2 Std");
  assert.equal(formatDuration(-5), "0 Min");
});
