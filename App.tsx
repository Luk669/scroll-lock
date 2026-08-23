import React, { useState } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import YouTubeScreen from "./src/screens/YouTubeScreen";
import InstagramScreen from "./src/screens/InstagramScreen";

type Tab = "youtube" | "instagram";

export default function App() {
  const [tab, setTab] = useState<Tab>("youtube");

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.content}>
          {tab === "youtube" ? <YouTubeScreen /> : <InstagramScreen />}
        </View>
        <View style={styles.tabBar}>
          <TabButton
            label="YouTube"
            active={tab === "youtube"}
            onPress={() => setTab("youtube")}
          />
          <TabButton
            label="Instagram"
            active={tab === "instagram"}
            onPress={() => setTab("instagram")}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    backgroundColor: "#111",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabLabel: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#fff",
  },
});
