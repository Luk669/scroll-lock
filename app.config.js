// Dynamische Expo-Config: liest APP_VARIANT aus der Umgebung und liefert
// pro Variante einen eigenen App-Namen, Slug und Bundle-/Package-ID. So
// entstehen aus einer Codebasis drei eigenständig installierbare Apps
// (eigenes Icon, eigener Name auf dem Home-Bildschirm), die jeweils nur
// eine Plattform zeigen.
//
// Lokal starten:   APP_VARIANT=youtube npx expo start   (bzw. npm run start:youtube)
// Build:            eas build --profile youtube          (siehe eas.json)

const VARIANTS = {
  youtube: {
    name: "TubeLite",
    slug: "scroll-lock-youtube",
    bundleIdentifier: "com.luk669.scrolllock.youtube",
    package: "com.luk669.scrolllock.youtube",
  },
  instagram: {
    name: "InstaLite",
    slug: "scroll-lock-instagram",
    bundleIdentifier: "com.luk669.scrolllock.instagram",
    package: "com.luk669.scrolllock.instagram",
  },
  facebook: {
    name: "FaceLite",
    slug: "scroll-lock-facebook",
    bundleIdentifier: "com.luk669.scrolllock.facebook",
    package: "com.luk669.scrolllock.facebook",
  },
};

const variant = process.env.APP_VARIANT || "youtube";
const current = VARIANTS[variant];

if (!current) {
  throw new Error(
    `Unbekannte APP_VARIANT "${variant}". Erlaubt: ${Object.keys(VARIANTS).join(", ")}`
  );
}

module.exports = {
  expo: {
    name: current.name,
    slug: current.slug,
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: current.bundleIdentifier,
    },
    android: {
      package: current.package,
    },
    web: {
      bundler: "metro",
    },
    // Zur Laufzeit lesbar über expo-constants (siehe App.tsx)
    extra: {
      variant,
    },
  },
};
