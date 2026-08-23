/**
 * Wird in die m.youtube.com-WebView injiziert.
 *
 * Aufgabe:
 *  - Shorts-Kacheln (im Feed) und den "Shorts"-Tab in der unteren Navigation
 *    ausblenden.
 *  - Läuft per MutationObserver dauerhaft weiter, weil YouTube eine
 *    Single-Page-App ist und Inhalte laufend nachlädt.
 *
 * Die Auswahl des Abo-Feeds (statt der algorithmischen Startseite) passiert
 * bereits über die geladene URL (siehe YouTubeScreen.tsx), nicht hier.
 */
export const YOUTUBE_INJECTED_JS = `
(function () {
  function hideShorts() {
    // Shorts-Kacheln im Feed (verschiedene YouTube-Web-Layouts abdecken)
    document
      .querySelectorAll(
        [
          'ytm-shorts-lockup-view-model-v2',
          'ytm-shorts-lockup-view-model',
          'ytm-reel-shelf-renderer',
          'ytm-reel-item-renderer',
          'a[href^="/shorts"]',
        ].join(',')
      )
      .forEach(function (el) {
        var container =
          el.closest(
            'ytm-rich-item-renderer, ytm-reel-shelf-renderer, ytm-item-section-renderer'
          ) || el;
        container.style.display = 'none';
      });

    // "Shorts"-Tab in der unteren Navigationsleiste
    document
      .querySelectorAll('ytm-pivot-bar-item-renderer, a')
      .forEach(function (el) {
        var text = (el.textContent || '').trim().toLowerCase();
        if (text === 'shorts') {
          el.style.display = 'none';
        }
      });
  }

  hideShorts();

  var observer = new MutationObserver(function () {
    hideShorts();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  true; // Rückgabewert für injectedJavaScript wird von RN erwartet
})();
`;
