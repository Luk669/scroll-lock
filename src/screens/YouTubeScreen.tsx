import React from "react";

import FilteredWebView from "../components/FilteredWebView";
import { YOUTUBE_INJECTED_JS } from "../injected/youtube";

// /feed/subscriptions zeigt ausschließlich Videos abonnierter Kanäle,
// chronologisch statt algorithmisch — Voraussetzung ist ein eingeloggter
// Google-Account (Login läuft über die WebView, siehe README zu den
// Einschränkungen von Google bei eingebetteten WebViews).
const YOUTUBE_SUBSCRIPTIONS_URL = "https://m.youtube.com/feed/subscriptions";

export default function YouTubeScreen() {
  return (
    <FilteredWebView
      uri={YOUTUBE_SUBSCRIPTIONS_URL}
      injectedJavaScript={YOUTUBE_INJECTED_JS}
      blockedUrlPart="/shorts"
    />
  );
}
