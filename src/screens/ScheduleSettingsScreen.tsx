import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  DAY_KEYS,
  DAY_LABELS,
  DAY_SHORT_LABELS,
  WEEKDAY_KEYS,
  WEEKEND_KEYS,
  addDays,
  sortWindows,
  validateWindows,
} from "../schedule/engine";
import type { DayKey, Schedule, TimeWindow } from "../schedule/types";

const LOCK_PRESETS: Array<{ label: string; days: number }> = [
  { label: "1 Woche", days: 7 },
  { label: "2 Wochen", days: 14 },
  { label: "4 Wochen", days: 28 },
];

export default function ScheduleSettingsScreen({
  schedule,
  locked,
  now,
  onSave,
  onClose,
}: {
  schedule: Schedule;
  locked: boolean;
  now: Date;
  onSave: (next: Schedule) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Schedule>(() => clone(schedule));
  const [selectedDay, setSelectedDay] = useState<DayKey>("mon");
  const [saving, setSaving] = useState(false);

  const windows = draft.days[selectedDay].windows;
  const error = useMemo(() => validateWindows(windows), [windows]);

  function updateWindows(next: TimeWindow[]) {
    setDraft((previous) => ({
      ...previous,
      days: { ...previous.days, [selectedDay]: { windows: next } },
    }));
  }

  function patchWindow(index: number, patch: Partial<TimeWindow>) {
    updateWindows(
      windows.map((window, i) => (i === index ? { ...window, ...patch } : window))
    );
  }

  function copyTo(targets: DayKey[]) {
    setDraft((previous) => {
      const days = { ...previous.days };
      for (const key of targets) {
        days[key] = { windows: windows.map((window) => ({ ...window })) };
      }
      return { ...previous, days };
    });
  }

  function requestLock(days: number) {
    const until = addDays(now, days);
    Alert.alert(
      "Zeitplan sperren?",
      `Der Zeitplan lässt sich bis zum ${until.toLocaleDateString("de-DE")} ` +
        "nicht mehr ändern. Das kann nicht rückgängig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Sperren",
          style: "destructive",
          onPress: () => {
            void persist({ ...draft, lockedUntil: until.toISOString() });
          },
        },
      ]
    );
  }

  async function persist(next: Schedule) {
    setSaving(true);
    const normalized: Schedule = {
      ...next,
      days: Object.fromEntries(
        DAY_KEYS.map((key) => [
          key,
          { windows: sortWindows(next.days[key].windows) },
        ])
      ) as Schedule["days"],
    };
    await onSave(normalized);
    setSaving(false);
    onClose();
  }

  function handleSave() {
    for (const key of DAY_KEYS) {
      const dayError = validateWindows(draft.days[key].windows);
      if (dayError) {
        Alert.alert(`${DAY_LABELS[key]}: Zeitplan unvollständig`, dayError);
        return;
      }
    }
    void persist(draft);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityRole="button">
          <Text style={styles.headerAction}>Schließen</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Zeitplan</Text>
        {locked ? (
          <Text style={styles.headerActionDisabled}>Gesperrt</Text>
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.headerAction}>Sichern</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {locked && draft.lockedUntil && (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerText}>
              🔒 Gesperrt bis{" "}
              {new Date(draft.lockedUntil).toLocaleDateString("de-DE")}. Bis
              dahin sind keine Änderungen möglich.
            </Text>
          </View>
        )}

        <View style={styles.dayRow}>
          {DAY_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setSelectedDay(key)}
              style={[styles.dayChip, selectedDay === key && styles.dayChipOn]}
              accessibilityRole="button"
              accessibilityLabel={DAY_LABELS[key]}
            >
              <Text
                style={[
                  styles.dayChipText,
                  selectedDay === key && styles.dayChipTextOn,
                ]}
              >
                {DAY_SHORT_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          {DAY_LABELS[selectedDay]} — Zeitfenster
        </Text>
        <Text style={styles.hint}>
          Zeiten außerhalb aller Fenster sind gesperrt.
        </Text>

        {windows.length === 0 && (
          <Text style={styles.empty}>
            Kein Fenster — dieser Tag ist komplett gesperrt.
          </Text>
        )}

        {windows.map((window, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.timeRow}>
              <TimeField
                label="von"
                value={window.start}
                editable={!locked}
                onChange={(value) => patchWindow(index, { start: value })}
              />
              <TimeField
                label="bis"
                value={window.end}
                editable={!locked}
                onChange={(value) => patchWindow(index, { end: value })}
              />
            </View>

            <View style={styles.limitRow}>
              <Text style={styles.label}>Unbegrenzt</Text>
              <Switch
                value={window.limitMinutes === null}
                disabled={locked}
                onValueChange={(unlimited) =>
                  patchWindow(index, { limitMinutes: unlimited ? null : 45 })
                }
              />
            </View>

            {window.limitMinutes !== null && (
              <View style={styles.limitRow}>
                <Text style={styles.label}>Minuten</Text>
                <TextInput
                  value={String(window.limitMinutes)}
                  editable={!locked}
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    patchWindow(index, {
                      limitMinutes: Number(text.replace(/\D/g, "")) || 0,
                    })
                  }
                  style={styles.numberInput}
                />
              </View>
            )}

            {!locked && (
              <Pressable
                onPress={() =>
                  updateWindows(windows.filter((_, i) => i !== index))
                }
                accessibilityRole="button"
              >
                <Text style={styles.remove}>Fenster entfernen</Text>
              </Pressable>
            )}
          </View>
        ))}

        {error && <Text style={styles.error}>{error}</Text>}

        {!locked && (
          <>
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                updateWindows([
                  ...windows,
                  { start: "20:00", end: "23:00", limitMinutes: null },
                ])
              }
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>+ Zeitfenster</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Auf andere Tage übernehmen</Text>
            <View style={styles.copyRow}>
              <CopyButton label="Mo–Fr" onPress={() => copyTo(WEEKDAY_KEYS)} />
              <CopyButton label="Sa+So" onPress={() => copyTo(WEEKEND_KEYS)} />
              <CopyButton label="Alle" onPress={() => copyTo(DAY_KEYS)} />
            </View>

            <Text style={styles.sectionTitle}>Für Prüfungsphasen sperren</Text>
            <Text style={styles.hint}>
              Sichert den aktuellen Plan für einen festen Zeitraum. Danach sind
              bis zum Ablauf keine Änderungen mehr möglich — auch keine
              Lockerungen.
            </Text>
            <View style={styles.copyRow}>
              {LOCK_PRESETS.map((preset) => (
                <CopyButton
                  key={preset.days}
                  label={preset.label}
                  onPress={() => requestLock(preset.days)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TimeField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.timeField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        editable={editable}
        placeholder="07:00"
        placeholderTextColor="#666"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        onChangeText={onChange}
        style={styles.timeInput}
      />
    </View>
  );
}

function CopyButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.secondaryButton}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function clone(schedule: Schedule): Schedule {
  return {
    lockedUntil: schedule.lockedUntil,
    days: Object.fromEntries(
      DAY_KEYS.map((key) => [
        key,
        { windows: schedule.days[key].windows.map((window) => ({ ...window })) },
      ])
    ) as Schedule["days"],
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  headerAction: { color: "#7cc6ff", fontSize: 16 },
  headerActionDisabled: { color: "#666", fontSize: 16 },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  lockBanner: {
    backgroundColor: "#2a1f00",
    borderColor: "#7a5c00",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  lockBannerText: { color: "#ffd479", fontSize: 14, lineHeight: 20 },
  dayRow: { flexDirection: "row", gap: 6 },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  dayChipOn: { backgroundColor: "#2b5d85" },
  dayChipText: { color: "#9a9a9a", fontSize: 13, fontWeight: "600" },
  dayChipTextOn: { color: "#fff" },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  hint: { color: "#8a8a8a", fontSize: 13, lineHeight: 18 },
  empty: { color: "#8a8a8a", fontSize: 14, fontStyle: "italic" },
  card: {
    backgroundColor: "#151515",
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  timeRow: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1, gap: 6 },
  label: { color: "#9a9a9a", fontSize: 13 },
  timeInput: {
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  numberInput: {
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 16,
    minWidth: 80,
    textAlign: "right",
  },
  remove: { color: "#ff7b72", fontSize: 14 },
  error: { color: "#ff7b72", fontSize: 14 },
  secondaryButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flexGrow: 1,
  },
  secondaryButtonText: { color: "#7cc6ff", fontSize: 15, fontWeight: "600" },
  copyRow: { flexDirection: "row", gap: 8 },
});
