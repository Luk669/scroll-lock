import React from "react";

import FilteredWebView from "../components/FilteredWebView";
import { FACEBOOK_INJECTED_JS } from "../injected/facebook";

// ?sk=h_chr = klassischer chronologischer Feed ("Neueste Beiträge"): zeigt
// Beiträge von Freunden/gefolgten Seiten in zeitlicher statt algorithmischer
// Reihenfolge — das nächstliegende Äquivalent zu einem reinen "Abo-Feed" auf
// Facebook.
const FACEBOOK_CHRONOLOGICAL_URL = "https://m.facebook.com/?sk=h_chr";

export default function FacebookScreen() {
  return (
    <FilteredWebView
      uri={FACEBOOK_CHRONOLOGICAL_URL}
      injectedJavaScript={FACEBOOK_INJECTED_JS}
      blockedUrlPart="/reel/"
    />
  );
}
