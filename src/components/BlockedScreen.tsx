import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatOpening } from "../schedule/engine";
import type { Evaluation } from "../schedule/engine";

export default function BlockedScreen({
  evaluation,
  now,
}: {
  evaluation: Extract<Evaluation, { status: "blocked" }>;
  now: Date;
}) {
  const reason =
    evaluation.reason === "limit_reached"
      ? "Deine Zeit für dieses Zeitfenster ist aufgebraucht."
      : "Außerhalb deiner freigegebenen Zeiten.";

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.headline}>Gesperrt</Text>
      <Text style={styles.reason}>{reason}</Text>
      {evaluation.nextOpening ? (
        <Text style={styles.next}>
          Wieder frei: {formatOpening(evaluation.nextOpening, now)}
        </Text>
      ) : (
        <Text style={styles.next}>
          In den nächsten sieben Tagen ist kein Zeitfenster freigegeben.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
    backgroundColor: "#000",
  },
  icon: { fontSize: 44 },
  headline: { color: "#fff", fontSize: 26, fontWeight: "700" },
  reason: { color: "#bdbdbd", fontSize: 16, textAlign: "center" },
  next: { color: "#7cc6ff", fontSize: 16, textAlign: "center", marginTop: 6 },
});
