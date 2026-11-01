// Build-time wrapper. The unchanged userscript body is appended inside this scope.
(async () => {
  'use strict';
  if (!/^https:\/\/(?:www\.)?imdb\.com\/name\/nm\d+(?:[/?#]|$)/.test(location.href)) return;
  if (document.getElementById('imdb-poster-browser')) return;
  const cache = new Map();
  try {
    const saved = await chrome.storage.local.get(null);
    const expired = [];
    for (const [key, value] of Object.entries(saved)) {
      if (!/^rt:tt\d+$/.test(key)) continue;
      if (value && value.expires > Date.now()) cache.set(key, value);
      else expired.push(key);
    }
    if (expired.length) chrome.storage.local.remove(expired).catch(() => {});
  } catch { /* Local caching is optional. */ }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) {
      if (!/^rt:tt\d+$/.test(key)) continue;
      if (change.newValue) cache.set(key, change.newValue);
      else cache.delete(key);
    }
  });
  function GM_getValue(key, fallback) { return cache.has(key) ? cache.get(key) : fallback; }
  function GM_setValue(key, value) {
    cache.set(key, value);
    try { chrome.storage.local.set({[key]: value}).catch(() => {}); }
    catch { /* Keep the in-memory result if the extension was updated or storage failed. */ }
  }
  function GM_xmlhttpRequest(options) {
    let finished = false;
    let timer;
    const finish = (callback, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback?.(value);
    };
    timer = setTimeout(() => finish(options.ontimeout, new Error('Rating request timed out')), 15000);
    try {
      const url = new URL(options.url);
      if (options.method !== 'GET' || url.origin !== 'https://www.rottentomatoes.com' ||
          url.pathname !== '/search' || [...url.searchParams.keys()].some(key => key !== 'search')) {
        throw new Error('Unsupported rating request');
      }
      chrome.runtime.sendMessage({type: 'rt-search', title: url.searchParams.get('search')})
        .then(response => {
          if (!response?.ok) {
            finish(response?.error === 'timeout' ? options.ontimeout : options.onerror, new Error('Rating unavailable'));
          } else finish(options.onload, {status: 200, responseText: response.html});
        }).catch(error => finish(options.onerror, error));
    } catch (error) { finish(options.onerror, error); }
    return {abort: () => finish(options.onabort, new Error('Rating request aborted'))};
  }

  // USER_SCRIPT_BODY
