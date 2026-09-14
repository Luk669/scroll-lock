import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import ScheduleGate from "./src/components/ScheduleGate";
import FacebookScreen from "./src/screens/FacebookScreen";
import InstagramScreen from "./src/screens/InstagramScreen";
import YouTubeScreen from "./src/screens/YouTubeScreen";

// Jeder Build zeigt genau eine Plattform — welche, bestimmt APP_VARIANT
// (gesetzt in app.config.js, siehe dort). Dadurch entstehen aus einer
// Codebasis drei separat installierbare Apps (TubeLite, InstaLite,
// FaceLite), statt einer App mit internem Tab-Umschalter.
const VARIANTS = {
  youtube: { label: "TubeLite", screen: YouTubeScreen },
  instagram: { label: "InstaLite", screen: InstagramScreen },
  facebook: { label: "FaceLite", screen: FacebookScreen },
} as const;

type Variant = keyof typeof VARIANTS;

export default function App() {
  const key = (Constants.expoConfig?.extra?.variant as Variant) ?? "youtube";
  const { label, screen: Screen } = VARIANTS[key] ?? VARIANTS.youtube;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <ScheduleGate title={label}>
            <Screen />
          </ScheduleGate>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1 },
});
