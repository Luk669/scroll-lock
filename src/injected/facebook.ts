/**
 * Wird in die m.facebook.com-WebView injiziert.
 *
 * Aufgabe:
 *  - Reels-Kacheln und -Links ausblenden.
 *  - Läuft per MutationObserver dauerhaft weiter, da Facebook eine
 *    Single-Page-App ist.
 *
 * Der chronologische Feed (nur Beiträge von Freunden/gefolgten Seiten,
 * neueste zuerst statt algorithmisch sortiert) wird bereits über die
 * geladene URL ausgewählt (siehe FacebookScreen.tsx, `?sk=h_chr`), nicht
 * hier.
 */
export const FACEBOOK_INJECTED_JS = `
(function () {
  function hideReels() {
    document
      .querySelectorAll('a[href*="/reel/"], a[href*="/reels/"]')
      .forEach(function (el) {
        var container =
          el.closest('div[role="article"], section') || el;
        container.style.display = 'none';
      });

    document.querySelectorAll('[aria-label="Reels"]').forEach(function (el) {
      var container = el.closest('div[role="article"], section, div') || el;
      container.style.display = 'none';
    });
  }

  hideReels();

  var observer = new MutationObserver(function () {
    hideReels();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  true;
})();
`;
