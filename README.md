# scroll-lock

Drei Apps gegen endloses Doomscrolling — **TubeLite**, **InstaLite**,
**FaceLite** — je eine für YouTube, Instagram und Facebook. Kein
Shorts-/Reels-Feed, im Feed sind nur Beiträge von Kanälen bzw. Accounts zu
sehen, denen du folgst.

## Wie das funktioniert

Es gibt keine offizielle API, mit der eine fremde App das Verhalten der
echten YouTube-, Instagram- oder Facebook-App verändern kann (weder auf iOS
noch auf Android, ohne Jailbreak/Root). `scroll-lock` löst das deshalb wie
"distraction-free" Apps es tun (z. B. SocialLite): Jede der drei Apps ist
eine eigene, schlanke App, die die **mobile Webversion** der jeweiligen
Plattform in einer eingebetteten WebView anzeigt und dabei gezielt:

- **TubeLite** (`m.youtube.com`): lädt direkt den **Abo-Feed**
  (`/feed/subscriptions`) statt der algorithmischen Startseite. Shorts-Kacheln
  und der "Shorts"-Tab werden per injiziertem JavaScript ausgeblendet, Klicks
  auf `/shorts`-Links werden blockiert.
- **InstaLite** (`instagram.com`): schaltet den Feed automatisch auf
  **"Following"** (statt "For you") und blendet den Reels-Tab sowie die
  Reels-Vorschauleiste im Feed aus. Klicks auf `/reels/`-Links werden
  blockiert.
- **FaceLite** (`m.facebook.com`): lädt den **chronologischen Feed**
  (`?sk=h_chr` — "Neueste Beiträge" statt algorithmischer Feed) und blendet
  Reels-Kacheln/-Links aus.

Login läuft ganz normal über die WebView (du meldest dich mit deinem
bestehenden Google-, Instagram- bzw. Facebook-Konto an; `scroll-lock` sieht
oder speichert deine Zugangsdaten nicht).

### Drei Apps aus einer Codebasis

Alle drei Apps teilen sich denselben Code. Welche Plattform eine konkrete
App zeigt, steuert die Umgebungsvariable `APP_VARIANT`
(`youtube` / `instagram` / `facebook`), ausgewertet in `app.config.js`. Das
legt pro Variante App-Name, Slug und Bundle-/Package-ID fest — dadurch lassen
sich TubeLite, InstaLite und FaceLite als **drei separate Apps**
installieren, jede mit eigenem Icon und Namen auf dem Home-Bildschirm.

### Offizielle Apps blockieren

`scroll-lock` kann das Öffnen der echten Instagram-/YouTube-/Facebook-Apps
**nicht selbst** verhindern — dafür gibt es keine öffentliche iOS-/
Android-API. Nutze stattdessen die Bordmittel deines Handys:

- **iOS**: Einstellungen → Bildschirmzeit → App-Limits (oder "Immer erlaubt"
  invertiert nutzen: die drei Apps sperren, Zeitlimit `0`, mit Code
  schützen).
- **Android**: Einstellungen → Digitales Wohlbefinden → App-Timer (Timer auf
  die offiziellen Apps setzen, bzw. sie unter "Fokus-Modus" pausieren).

So bleiben TubeLite/InstaLite/FaceLite nutzbar, während die offiziellen Apps
gesperrt sind.

### Grenzen

- Die Filterung passiert über das DOM der mobilen Webseiten (CSS-Selektoren
  + `MutationObserver`). Ändern YouTube/Instagram/Facebook ihr Layout, kann
  es sein, dass einzelne Selektoren angepasst werden müssen
  (`src/injected/*.ts`).
- Facebook hat keinen reinen "Nur-Abo"-Feed wie YouTube; der chronologische
  Feed (`h_chr`) zeigt Beiträge von Freunden und gefolgten Seiten in
  zeitlicher statt algorithmischer Reihenfolge — das nächstliegende
  Äquivalent.

## Setup

```bash
npm install
npm run start:youtube    # oder start:instagram / start:facebook
```

Dann in Expo Go (iOS/Android) scannen, oder `i` / `a` für Simulator/Emulator
drücken.

## Eigenständige Builds (TestFlight, Play Store, o. Ä.)

Mit [EAS Build](https://docs.expo.dev/build/introduction/) (Expo-Account
nötig):

```bash
npm run build:youtube
npm run build:instagram
npm run build:facebook
```

Jeder Befehl erzeugt einen eigenen Build mit eigenem Namen/Bundle-ID (siehe
`eas.json` bzw. `app.config.js`).

## Projektstruktur

| Pfad | Inhalt |
|---|---|
| `app.config.js` | Legt pro `APP_VARIANT` Name/Slug/Bundle-ID fest |
| `App.tsx` | Einstiegspunkt, rendert je nach Variante genau einen Screen |
| `src/screens/YouTubeScreen.tsx` | WebView für den YouTube-Abo-Feed |
| `src/screens/InstagramScreen.tsx` | WebView für den Instagram-Following-Feed |
| `src/screens/FacebookScreen.tsx` | WebView für den Facebook-Chronologisch-Feed |
| `src/injected/youtube.ts` | Injiziertes JS: Shorts ausblenden |
| `src/injected/instagram.ts` | Injiziertes JS: Following-Feed erzwingen, Reels ausblenden |
| `src/injected/facebook.ts` | Injiziertes JS: Reels ausblenden |
| `eas.json` | Build-Profile für die drei Varianten |
