const personPage = /^https:\/\/(?:www\.)?imdb\.com\/name\/nm\d+(?:[/?#]|$)/;

// Only accepts a title, never an arbitrary URL or request headers from a page.
export function createRatingHandler(extensionId, fetchRequest = (...args) => fetch(...args), timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: id => clearTimeout(id)
}) {
  return (message, sender, respond) => {
    if (sender.id !== extensionId || sender.frameId !== 0 || !personPage.test(sender.url || '') ||
        message?.type !== 'rt-search' || typeof message.title !== 'string' ||
        !message.title.trim() || message.title.length > 500 || /[\u0000-\u001f\u007f]/.test(message.title)) return false;

    const controller = new AbortController();
    const timeout = timers.setTimeout(() => controller.abort(), 15000);
    (async () => {
      try {
        const url = 'https://www.rottentomatoes.com/search?search=' + encodeURIComponent(message.title);
        const response = await fetchRequest(url, {
          credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal
        });
        if (response.status !== 200) throw new Error('Rating unavailable');
        const html = await response.text();
        if (html.length > 2_000_000) throw new Error('Rating response too large');
        respond({ok: true, html});
      } catch {
        respond({ok: false, error: controller.signal.aborted ? 'timeout' : 'unavailable'});
      } finally { timers.clearTimeout(timeout); }
    })();
    return true;
  };
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(createRatingHandler(chrome.runtime.id));
}
