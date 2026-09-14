import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";

import ScheduleSettingsScreen from "../screens/ScheduleSettingsScreen";
import { useScheduleGuard } from "../schedule/useScheduleGuard";
import BlockedScreen from "./BlockedScreen";
import StatusBarRow from "./StatusBarRow";

/**
 * Setzt den Zeitplan durch: gibt die Inhalte nur frei, wenn das aktuelle
 * Zeitfenster es erlaubt. Bei Sperre werden die Kinder ausgehängt (nicht
 * nur überdeckt), damit die WebView nichts nachlädt.
 */
export default function ScheduleGate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Während der Zeitplan bearbeitet wird, läuft das Budget nicht weiter.
  const guard = useScheduleGuard(!settingsOpen);

  if (!guard.ready || !guard.schedule || !guard.evaluation) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const blocked = guard.evaluation.status === "blocked";

  return (
    <View style={styles.root}>
      <StatusBarRow
        title={title}
        evaluation={guard.evaluation}
        locked={guard.locked}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {blocked && guard.evaluation.status === "blocked" ? (
        <BlockedScreen evaluation={guard.evaluation} now={guard.now} />
      ) : (
        children
      )}

      <Modal
        visible={settingsOpen}
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <ScheduleSettingsScreen
          schedule={guard.schedule}
          locked={guard.locked}
          now={guard.now}
          onSave={guard.updateSchedule}
          onClose={() => setSettingsOpen(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
