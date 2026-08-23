import React, { useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { INSTAGRAM_INJECTED_JS } from "../injected/instagram";

const INSTAGRAM_URL = "https://www.instagram.com/";

export default function InstagramScreen() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: INSTAGRAM_URL }}
        injectedJavaScript={INSTAGRAM_INJECTED_JS}
        injectedJavaScriptBeforeContentLoaded={INSTAGRAM_INJECTED_JS}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={(request) => {
          return !request.url.includes("/reels/");
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
