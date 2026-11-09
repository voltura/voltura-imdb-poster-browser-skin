import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {unzipSync, strFromU8} from 'fflate';
import {createRatingHandler} from '../extension/worker.js';

const sender = {id: 'test-extension', frameId: 0, url: 'https://www.imdb.com/name/nm0000108/?ref_=test'};
function lookup(handler, message = {type: 'rt-search', title: 'A & B'}) {
  return new Promise(resolve => assert.equal(handler(message, sender, resolve), true));
}

test('worker constructs the fixed URL and omits credentials and referrer', async () => {
  let request;
  const handler = createRatingHandler(sender.id, async (url, options) => {
    request = {url, options};
    return {status: 200, text: async () => '<search-page-media-row></search-page-media-row>'};
  });
  assert.equal((await lookup(handler)).ok, true);
  assert.equal(request.url, 'https://www.rottentomatoes.com/search?search=A%20%26%20B');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.redirect, 'error');
  assert.equal(request.options.referrerPolicy, 'no-referrer');
});

test('worker rejects invalid senders and titles without fetching', () => {
  const handler = createRatingHandler(sender.id, () => assert.fail('Must not fetch'));
  for (const invalid of [
    {...sender, id: 'other'}, {...sender, frameId: 1}, {...sender, url: 'https://example.com/name/nm1/'},
    {...sender, url: 'https://www.imdb.com/title/tt123/'}, {...sender, url: 'http://www.imdb.com/name/nm1/'},
    {...sender, url: 'https://www.imdb.com.evil.test/name/nm1/'}, {...sender, url: 'https://www.imdb.com/name/nmno/'},
    {...sender, url: undefined}
  ]) assert.equal(handler({type: 'rt-search', title: 'Movie'}, invalid, () => assert.fail()), false);
  for (const title of [null, {}, '', '   ', 'x'.repeat(501), 'test\nheader']) {
    assert.equal(handler({type: 'rt-search', title}, sender, () => assert.fail()), false);
  }
  assert.equal(handler({type: 'fetch', url: 'https://example.com'}, sender, () => assert.fail()), false);
});

test('worker handles blocked access, HTTP errors and oversized responses', async () => {
  for (const fetcher of [
    async () => { throw new TypeError('Permission denied'); },
    async () => ({status: 403}),
    async () => ({status: 200, text: async () => 'x'.repeat(2_000_001)})
  ]) assert.deepEqual(await lookup(createRatingHandler(sender.id, fetcher)), {ok: false, error: 'unavailable'});
});

test('worker aborts after 15 seconds and clears its timer', async () => {
  let trigger, duration, cleared = false;
  const timers = {setTimeout(fn, ms) {trigger = fn; duration = ms; return 7;}, clearTimeout(id) {assert.equal(id, 7); cleared = true;}};
  const handler = createRatingHandler(sender.id, (_url, {signal}) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Aborted')));
  }), timers);
  const pending = lookup(handler);
  assert.equal(duration, 15000);
  trigger();
  assert.deepEqual(await pending, {ok: false, error: 'timeout'});
  assert.equal(cleared, true);
});

test('a newly started worker handles requests without prior in-memory state', async () => {
  for (let restart = 0; restart < 2; restart++) {
    const fresh = createRatingHandler(sender.id, async () => ({status: 200, text: async () => 'HTML'}));
    assert.deepEqual(await lookup(fresh), {ok: true, html: 'HTML'});
  }
});

async function adapter({saved = {}, storageError = false, send, href = sender.url, existing = false} = {}) {
  const source = await readFile(new URL('../extension/adapter.js', import.meta.url), 'utf8');
  const writes = [], removed = [], timers = new Map();
  let onChanged;
  const sandbox = {
    location: {href}, document: {getElementById: () => existing}, URL, Map, Date, Error,
    setTimeout: (fn, ms) => { const id = timers.size + 1; timers.set(id, {fn, ms}); return id; },
    clearTimeout: id => timers.delete(id),
    chrome: {
      storage: {
        local: {
          get: async () => {if (storageError) throw new Error('Storage unavailable'); return saved;},
          set: async value => {writes.push(value); if (storageError) throw new Error('Quota');},
          remove: async keys => {removed.push(...keys);}
        },
        onChanged: {addListener: fn => {onChanged = fn;}}
      },
      runtime: {sendMessage: send || (async () => ({ok: true, html: 'HTML'}))}
    }
  };
  vm.createContext(sandbox);
  await vm.runInContext(source.replace('  // USER_SCRIPT_BODY', 'globalThis.probe = {GM_getValue, GM_setValue, GM_xmlhttpRequest};'), sandbox);
  return {...sandbox.probe, sandbox, writes, removed, timers, change: (...args) => onChanged(...args)};
}

test('adapter hydrates valid cache, prunes expiry and follows cross-tab changes', async () => {
  const valid = {score: 0, expires: Date.now() + 10000};
  const a = await adapter({saved: {'rt:tt1': valid, 'rt:tt2': {expires: 1}, other: valid}});
  assert.equal(a.GM_getValue('rt:tt1', null).score, 0);
  assert.equal(a.GM_getValue('rt:tt2', null), null);
  assert.equal(a.GM_getValue('other', null), null);
  assert.deepEqual(a.removed, ['rt:tt2']);
  a.change({'rt:tt1': {newValue: {score: 83}}}, 'local');
  assert.equal(a.GM_getValue('rt:tt1', null).score, 83);
  a.change({'rt:tt1': {}}, 'local');
  assert.equal(a.GM_getValue('rt:tt1', null), null);
});

test('storage failure keeps the adapter usable with an in-memory cache', async () => {
  const a = await adapter({storageError: true});
  a.GM_setValue('rt:tt1', {score: 60});
  assert.equal(a.GM_getValue('rt:tt1', null).score, 60);
  await new Promise(resolve => setImmediate(resolve));
});

test('adapter relays only a title to the worker', async () => {
  let message;
  const a = await adapter({send: async value => {message = value; return {ok: true, html: 'DATA'};}});
  const result = await new Promise(resolve => a.GM_xmlhttpRequest({method: 'GET', url: 'https://www.rottentomatoes.com/search?search=A%20%26%20B', onload: resolve}));
  assert.deepEqual(JSON.parse(JSON.stringify(message)), {type: 'rt-search', title: 'A & B'});
  assert.equal(result.responseText, 'DATA');
  assert.equal(a.timers.size, 0);
});

test('adapter rejects arbitrary destinations', async () => {
  const a = await adapter({send: () => assert.fail('Must not message worker')});
  let errors = 0;
  for (const url of ['https://evil.test/search?search=x', 'https://www.rottentomatoes.com/m/movie', 'https://www.rottentomatoes.com/search?search=x&url=y']) {
    a.GM_xmlhttpRequest({method: 'GET', url, onerror: () => errors++});
  }
  assert.equal(errors, 3);
});

test('adapter timeout and abort each settle once despite late responses', async () => {
  for (const action of ['timeout', 'abort']) {
    let respond, settled = 0;
    const a = await adapter({send: () => new Promise(resolve => {respond = resolve;})});
    const handle = a.GM_xmlhttpRequest({method: 'GET', url: 'https://www.rottentomatoes.com/search?search=Movie',
      ontimeout: () => settled++, onabort: () => settled++, onload: () => settled++});
    if (action === 'timeout') {
      assert.equal([...a.timers.values()][0].ms, 15000);
      [...a.timers.values()][0].fn();
    } else handle.abort();
    respond({ok: true, html: 'late'});
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(settled, 1);
    assert.equal(a.timers.size, 0);
  }
});

test('adapter handles worker errors and missing extension context', async () => {
  for (const send of [async () => ({ok: false, error: 'unavailable'}), async () => {throw new Error('Extension context invalidated');}]) {
    const a = await adapter({send});
    await new Promise(resolve => a.GM_xmlhttpRequest({method: 'GET', url: 'https://www.rottentomatoes.com/search?search=Movie', onerror: resolve}));
    assert.equal(a.timers.size, 0);
  }
});

test('adapter skips unrelated pages and an existing userscript instance', async () => {
  for (const config of [{href: 'https://example.com/'}, {href: 'https://www.imdb.com/title/tt1/'}, {existing: true}]) {
    assert.equal((await adapter(config)).sandbox.probe, undefined);
  }
});

test('ZIP has a root manifest, only required permissions, and exact shared feature body', async () => {
  const bytes = await readFile(new URL('../dist/voltura-imdb-poster-browser-1.5.2.zip', import.meta.url));
  const files = unzipSync(bytes);
  const manifest = JSON.parse(strFromU8(files['manifest.json']));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.host_permissions, ['https://www.rottentomatoes.com/*']);
  assert.equal(manifest.content_scripts[0].run_at, 'document_idle');
  assert.equal(manifest.content_scripts[0].matches.length, 2);
  const original = (await readFile(new URL('../imdb-poster-browser.user.js', import.meta.url), 'utf8'))
    .replace(/\r\n/g, '\n').replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/, '');
  assert.ok(strFromU8(files['content.js']).endsWith(original + '\n})();\n'));
  assert.deepEqual(Object.keys(files).sort(), ['content.js', 'icons/128.png', 'icons/16.png', 'icons/32.png', 'icons/48.png', 'manifest.json', 'worker.js'].sort());
});
