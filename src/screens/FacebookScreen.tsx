import React, { useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { FACEBOOK_INJECTED_JS } from "../injected/facebook";

// ?sk=h_chr = klassischer chronologischer Feed ("Neueste Beiträge"): zeigt
// Beiträge von Freunden/gefolgten Seiten in zeitlicher statt algorithmischer
// Reihenfolge — das nächstliegende Äquivalent zu einem reinen "Abo-Feed" auf
// Facebook.
const FACEBOOK_CHRONOLOGICAL_URL = "https://m.facebook.com/?sk=h_chr";

export default function FacebookScreen() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: FACEBOOK_CHRONOLOGICAL_URL }}
        injectedJavaScript={FACEBOOK_INJECTED_JS}
        injectedJavaScriptBeforeContentLoaded={FACEBOOK_INJECTED_JS}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={(request) => {
          return !request.url.includes("/reel/");
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
