/**
 * Wird in die instagram.com-WebView injiziert.
 *
 * Aufgabe:
 *  - Auf der Startseite den Feed-Umschalter auf "Following" stellen, damit
 *    nur Beiträge abonnierter/gefolgter Konten erscheinen.
 *  - Den Reels-Tab (untere Navigation) und die Reels-Vorschauleiste im Feed
 *    ausblenden.
 *  - Läuft per MutationObserver dauerhaft weiter, da Instagram eine
 *    Single-Page-App ist.
 *
 * Wichtig: Der Umschalter wird NUR auf der Startseite und nur einmal pro
 * Seitenaufruf betätigt. Auf Profilseiten heißt der Entfolgen-Button
 * ebenfalls "Following" — ein blindes Klicken würde dort Konten entfolgen.
 */
export const INSTAGRAM_INJECTED_JS = `
(function () {
  var switchedPath = null;

  function onHomeFeed() {
    return location.pathname === '/' || location.pathname === '';
  }

  function enforceFollowingFeed() {
    if (!onHomeFeed()) return;
    if (switchedPath === location.href) return;

    // Der Feed-Umschalter sitzt in der Kopfzeile und ist ein Tab bzw.
    // Menüpunkt — nicht der Entfolgen-Button einer Profilseite.
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll(
        'header [role="tab"], header [role="menuitem"], ' +
          'div[role="tablist"] [role="tab"], main [role="tablist"] [role="tab"]'
      )
    );

    var followingTab = candidates.filter(function (el) {
      return (el.textContent || '').trim() === 'Following';
    })[0];

    if (!followingTab) return;
    if (followingTab.getAttribute('aria-selected') === 'true') {
      switchedPath = location.href;
      return;
    }

    followingTab.click();
    switchedPath = location.href;
  }

  function hideReels() {
    document
      .querySelectorAll('a[href="/reels/"], a[href^="/reels/"]')
      .forEach(function (el) {
        el.style.display = 'none';
      });

    document.querySelectorAll('[aria-label="Reels"]').forEach(function (el) {
      var container = el.closest('section, div');
      if (container) {
        container.style.display = 'none';
      }
    });
  }

  function tick() {
    enforceFollowingFeed();
    hideReels();
  }

  tick();

  var observer = new MutationObserver(function () {
    tick();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  true;
})();
`;
