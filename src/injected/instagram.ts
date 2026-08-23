/**
 * Wird in die instagram.com-WebView injiziert.
 *
 * Aufgabe:
 *  - Falls vorhanden, den Feed-Umschalter oben auf "Following" (statt "For
 *    you") stellen, damit nur Beiträge abonnierter/gefolgter Konten
 *    erscheinen.
 *  - Den Reels-Tab (untere Navigation) und die Reels-Vorschauleiste im Feed
 *    ausblenden.
 *  - Läuft per MutationObserver dauerhaft weiter, da Instagram eine
 *    Single-Page-App ist.
 */
export const INSTAGRAM_INJECTED_JS = `
(function () {
  function enforceFollowingFeed() {
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll('div[role="button"], a, span')
    );
    var followingBtn = candidates.find(function (el) {
      return (el.textContent || '').trim() === 'Following';
    });
    if (followingBtn && followingBtn.getAttribute('aria-selected') !== 'true') {
      followingBtn.click();
    }
  }

  function hideReels() {
    // Reels-Links (Tab unten, Menüpunkte)
    document
      .querySelectorAll('a[href="/reels/"], a[href^="/reels/"]')
      .forEach(function (el) {
        el.style.display = 'none';
      });

    // Reels-Vorschauleiste oben im Feed
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
