# scroll-lock

Eine App (iOS & Android) gegen endloses Doomscrolling: kein Shorts-Feed bei
YouTube, keine Reels bei Instagram, und im Feed sind nur Beiträge von Kanälen
bzw. Accounts zu sehen, die du abonniert hast bzw. denen du folgst.

## Wie das funktioniert

Es gibt keine offizielle API, mit der eine fremde App das Verhalten der
echten YouTube- oder Instagram-App verändern kann (weder auf iOS noch auf
Android, ohne Jailbreak/Root). `scroll-lock` löst das deshalb wie
"distraction-free" Apps es tun (z. B. SocialLite): Es ist eine eigene,
schlanke App, die die **mobile Webversion** von YouTube (`m.youtube.com`)
und Instagram (`instagram.com`) in einer eingebetteten WebView anzeigt und
dabei gezielt:

- **YouTube**: lädt direkt den **Abo-Feed** (`/feed/subscriptions`) statt der
  algorithmischen Startseite. Zusätzlich werden Shorts-Kacheln und der
  "Shorts"-Tab per injiziertem JavaScript ausgeblendet, Klicks auf
  `/shorts`-Links werden blockiert.
- **Instagram**: schaltet den Feed automatisch auf **"Following"** (statt
  "For you") und blendet den Reels-Tab sowie die Reels-Vorschauleiste im Feed
  aus. Klicks auf `/reels/`-Links werden blockiert.

Login läuft ganz normal über die WebView (du meldest dich mit deinem
bestehenden Google- bzw. Instagram-Konto an; `scroll-lock` sieht oder
speichert deine Zugangsdaten nicht).

### Grenzen

- Das ist **kein** Eingriff in die offiziellen Apps — wer die echte
  YouTube-/Instagram-App weiter installiert hat, kann darüber natürlich
  weiter Shorts/Reels sehen. `scroll-lock` ist als bewusste Alternative
  gedacht, die du anstelle der offiziellen Apps nutzt.
- Die Filterung passiert über das DOM der mobilen Webseiten (CSS-Selektoren
  + `MutationObserver`). Ändert YouTube/Instagram ihr Layout, kann es sein,
  dass einzelne Selektoren angepasst werden müssen
  (`src/injected/youtube.ts`, `src/injected/instagram.ts`).
- Für eine echte Systemsperre (z. B. die offiziellen Apps zeitweise ganz zu
  blockieren) eignen sich zusätzlich die Bordmittel des Betriebssystems:
  **Bildschirmzeit** (iOS, App-Limits/App-Beschränkungen) bzw.
  **Digitales Wohlbefinden** (Android, App-Timer).

## Setup

```bash
npm install
npx expo start
```

Dann in Expo Go (iOS/Android) scannen, oder `i` / `a` für Simulator/Emulator
drücken.

## Projektstruktur

| Pfad | Inhalt |
|---|---|
| `App.tsx` | Einstiegspunkt, einfacher Tab-Umschalter YouTube ⇄ Instagram |
| `src/screens/YouTubeScreen.tsx` | WebView für den YouTube-Abo-Feed |
| `src/screens/InstagramScreen.tsx` | WebView für den Instagram-Following-Feed |
| `src/injected/youtube.ts` | Injiziertes JS: Shorts ausblenden |
| `src/injected/instagram.ts` | Injiziertes JS: Following-Feed erzwingen, Reels ausblenden |
