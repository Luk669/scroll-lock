import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDuration, formatTime, minutesOfDay } from "../schedule/engine";
import type { Evaluation } from "../schedule/engine";

export default function StatusBarRow({
  title,
  evaluation,
  locked,
  onOpenSettings,
}: {
  title: string;
  evaluation: Evaluation | null;
  locked: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.status} numberOfLines={1}>
        {describe(evaluation)}
      </Text>
      <Pressable
        onPress={onOpenSettings}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Zeitplan öffnen"
      >
        <Text style={styles.buttonLabel}>{locked ? "🔒" : "⚙"}</Text>
      </Pressable>
    </View>
  );
}

function describe(evaluation: Evaluation | null): string {
  if (!evaluation) return "";
  if (evaluation.status === "blocked") return "gesperrt";
  if (evaluation.remainingMinutes === null) {
    return `frei bis ${formatTime(minutesOfDay(evaluation.windowEndsAt))}`;
  }
  return `noch ${formatDuration(evaluation.remainingMinutes)}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#111",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  title: { color: "#fff", fontSize: 14, fontWeight: "700" },
  status: { color: "#9a9a9a", fontSize: 13, flex: 1 },
  button: { paddingHorizontal: 6, paddingVertical: 2 },
  buttonLabel: { fontSize: 18, color: "#fff" },
});
