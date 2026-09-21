import React from "react";

import FilteredWebView from "../components/FilteredWebView";
import { INSTAGRAM_INJECTED_JS } from "../injected/instagram";

const INSTAGRAM_URL = "https://www.instagram.com/";

export default function InstagramScreen() {
  return (
    <FilteredWebView
      uri={INSTAGRAM_URL}
      injectedJavaScript={INSTAGRAM_INJECTED_JS}
      blockedUrlPart="/reels/"
    />
  );
}
