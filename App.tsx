import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import YouTubeScreen from "./src/screens/YouTubeScreen";
import InstagramScreen from "./src/screens/InstagramScreen";
import FacebookScreen from "./src/screens/FacebookScreen";

// Jeder Build zeigt genau eine Plattform — welche, bestimmt APP_VARIANT
// (gesetzt in app.config.js, siehe dort). Dadurch entstehen aus einer
// Codebasis drei separat installierbare Apps (TubeLite, InstaLite,
// FaceLite), statt einer App mit internem Tab-Umschalter.
const SCREENS = {
  youtube: YouTubeScreen,
  instagram: InstagramScreen,
  facebook: FacebookScreen,
} as const;

type Variant = keyof typeof SCREENS;

export default function App() {
  const variant = (Constants.expoConfig?.extra?.variant as Variant) ?? "youtube";
  const Screen = SCREENS[variant] ?? YouTubeScreen;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <Screen />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1 },
});
