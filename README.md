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

### Anmeldung

Die Anmeldung läuft in der WebView. Dafür sind Cookies (auch von
Drittanbietern), DOM-Storage und eine Browser-übliche User-Agent-Kennung
gesetzt (`src/components/FilteredWebView.tsx`).

**Google ist der Sonderfall:** Google lässt Anmeldungen aus eingebetteten
WebViews grundsätzlich nicht zu und antwortet mit `disallowed_useragent`.
Eine andere User-Agent-Kennung umgeht das nicht zuverlässig — Google prüft
weitere Merkmale. Für TubeLite heißt das: Der Abo-Feed funktioniert nur,
solange eine gültige Sitzung besteht; eine Erstanmeldung im eingebetteten
Browser kann fehlschlagen.

Der saubere Weg für YouTube wäre deshalb, die WebView aufzugeben und
stattdessen die **YouTube Data API v3** mit OAuth über den Systembrowser
(`expo-auth-session`) anzusprechen: Abos abfragen, Shorts anhand der
Videolänge herausfiltern und eine eigene Liste anzeigen. Das ist von Google
ausdrücklich vorgesehen und wäre auch für den App Store tragfähig.

### Grenzen

- Die Filterung passiert über das DOM der mobilen Webseiten (CSS-Selektoren
  + `MutationObserver`). Ändern YouTube/Instagram/Facebook ihr Layout, kann
  es sein, dass einzelne Selektoren angepasst werden müssen
  (`src/injected/*.ts`).
- Facebook hat keinen reinen "Nur-Abo"-Feed wie YouTube; der chronologische
  Feed (`h_chr`) zeigt Beiträge von Freunden und gefolgten Seiten in
  zeitlicher statt algorithmischer Reihenfolge — das nächstliegende
  Äquivalent.

## Zeitplan (Stundenplan)

Jede App setzt einen wöchentlichen Zeitplan durch. Ist die Nutzung nicht
erlaubt, wird die WebView **ausgehängt** (nicht nur überdeckt) — es wird also
auch nichts im Hintergrund nachgeladen.

**Zeitfenster pro Wochentag.** Ein Fenster hat Beginn, Ende und entweder ein
Minutenbudget oder "unbegrenzt". Zeiten, die von keinem Fenster abgedeckt
sind, gelten als gesperrt. Voreingestellt ist:

| | Zeitfenster |
|---|---|
| Mo–Fr | 07:00–20:00 mit 45 Min Budget, danach 20:00–23:00 unbegrenzt |
| Sa+So | 09:00–23:00 unbegrenzt |

Jeder Wochentag lässt sich einzeln einstellen; mit "Mo–Fr", "Sa+So" und
"Alle" wird der aktuelle Tag auf die anderen übertragen.

**Budget-Anrechnung.** Zeit wird nur angerechnet, solange die App im
Vordergrund ist und ein Fenster mit Budget aktiv ist. Standby-Sprünge über
fünf Minuten werden verworfen, damit ein aufwachendes Gerät nicht das ganze
Budget verbrennt. Verbrauchsdaten älter als 14 Tage werden gelöscht.

**Sperre für Prüfungsphasen.** Der Plan lässt sich für 1, 2 oder 4 Wochen
sperren. Bis zum Ablauf sind dann keinerlei Änderungen möglich — auch keine
Verschärfungen, und die Sperre lässt sich nicht vorzeitig aufheben.

### Grenzen der Sperre

Die Sperre wirkt **innerhalb der App**. Wer die App löscht und neu
installiert, setzt Zeitplan und Budget zurück — lokaler Speicher überlebt
eine Deinstallation nicht. Eine wirklich manipulationssichere Sperre bräuchte
Apples Screen-Time-Framework (siehe unten) oder einen Server-gestützten
Account.

## App Store — Stand der Dinge

Die aktuelle Architektur (WebView um die mobilen Webseiten) ist **nicht**
für den App Store geeignet:

- **Richtlinie 4.2** (Minimum Functionality): reine Web-Wrapper werden
  abgelehnt.
- **Richtlinie 5.2.1** (Intellectual Property): fremde Marken und Inhalte —
  die Arbeitsnamen "TubeLite"/"InstaLite"/"FaceLite" wären ohnehin zu
  ersetzen.
- Die AGB von Google und Meta untersagen inoffizielle Clients.

Für eine echte Veröffentlichung wäre der Weg ein anderer, und zwar der, den
Apps wie Opal oder ScreenZen gehen:

1. Native iOS-App mit dem **FamilyControls/DeviceActivity**-Framework
   (Entitlement muss bei Apple beantragt werden). Sie sperrt die *offiziellen*
   Apps nach Zeitplan — genau die Logik aus `src/schedule/`.
2. Optional eine **Safari-Web-Erweiterung**, die Shorts/Reels im Browser
   ausblendet — das ist der erlaubte Weg für die Inhaltsfilterung.

Die Zeitplan-Logik in `src/schedule/` ist bewusst frei von WebView-Bezügen
und lässt sich bei einem solchen Umbau weiterverwenden.

## Setup

```bash
npm install
npm run start:youtube    # oder start:instagram / start:facebook
```

Tests der Zeitplan-Logik:

```bash
npm test
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
| `src/components/FilteredWebView.tsx` | Gemeinsame WebView: Filter-Skript, Login-Einstellungen, blockierte Pfade |
| `src/screens/YouTubeScreen.tsx` | WebView für den YouTube-Abo-Feed |
| `src/screens/InstagramScreen.tsx` | WebView für den Instagram-Following-Feed |
| `src/screens/FacebookScreen.tsx` | WebView für den Facebook-Chronologisch-Feed |
| `src/injected/youtube.ts` | Injiziertes JS: Shorts ausblenden |
| `src/injected/instagram.ts` | Injiziertes JS: Following-Feed erzwingen, Reels ausblenden |
| `src/injected/facebook.ts` | Injiziertes JS: Reels ausblenden |
| `eas.json` | Build-Profile für die drei Varianten |
| `src/schedule/engine.ts` | Regel-Engine: Fenster, Budgets, nächste Freigabe |
| `src/schedule/useScheduleGuard.ts` | Lädt den Plan, bewertet ihn, rechnet Zeit an |
| `src/components/ScheduleGate.tsx` | Gibt die Inhalte frei oder sperrt sie |
| `src/screens/ScheduleSettingsScreen.tsx` | Zeitplan bearbeiten und sperren |
| `src/schedule/engine.test.ts` | Tests der Regel-Engine (`npm test`) |
