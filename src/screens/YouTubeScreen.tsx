import React, { useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { YOUTUBE_INJECTED_JS } from "../injected/youtube";

// /feed/subscriptions zeigt ausschließlich Videos abonnierter Kanäle,
// chronologisch statt algorithmisch — Voraussetzung ist ein eingeloggter
// Google-Account (Login läuft ganz normal über die WebView).
const YOUTUBE_SUBSCRIPTIONS_URL = "https://m.youtube.com/feed/subscriptions";

export default function YouTubeScreen() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: YOUTUBE_SUBSCRIPTIONS_URL }}
        injectedJavaScript={YOUTUBE_INJECTED_JS}
        injectedJavaScriptBeforeContentLoaded={YOUTUBE_INJECTED_JS}
        onLoadEnd={() => setLoading(false)}
        // Verhindert, dass Klicks auf /shorts-Links (falls doch mal einer
        // durchrutscht) in einen neuen Tab/Fenster aufgehen.
        onShouldStartLoadWithRequest={(request) => {
          return !request.url.includes("/shorts");
        }}
        style={styles.webview}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
