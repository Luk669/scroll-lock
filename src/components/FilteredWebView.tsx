import React, { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

/**
 * Eigene User-Agent-Kennung. Ohne sie liefern die Plattformen der WebView
 * teils abgespeckte Seiten aus und Anmeldungen schlagen fehl, weil eine
 * eingebettete WebView als solche erkannt wird.
 *
 * Achtung: Google lehnt Anmeldungen in eingebetteten WebViews grundsätzlich
 * ab ("disallowed_useragent"). Eine andere Kennung hilft dort nicht
 * zuverlässig — siehe README.
 */
const USER_AGENT = Platform.select({
  ios:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  default: undefined,
});

export default function FilteredWebView({
  uri,
  injectedJavaScript,
  blockedUrlPart,
}: {
  uri: string;
  injectedJavaScript: string;
  /** Aufrufe, deren URL diesen Teil enthält, werden gar nicht erst geladen. */
  blockedUrlPart: string;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={(request) =>
          !request.url.includes(blockedUrlPart)
        }
        userAgent={USER_AGENT}
        // Anmeldung und Sitzung: Cookies müssen App-Neustarts überleben,
        // localStorage wird von allen drei Plattformen vorausgesetzt.
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        // Anmelde-Dialoge öffnen sich sonst in einem Fenster, das nie
        // sichtbar wird; so navigieren sie in derselben WebView.
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
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
