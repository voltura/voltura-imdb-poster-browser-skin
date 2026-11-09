import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile, mkdir, mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {titles, fixtureHtml, ratingHtml, modernFixtureHtml} from './fixtures.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'output/playwright');
await mkdir(out, {recursive:true});
const profile = await mkdtemp(path.join(tmpdir(), 'voltura-imdb-test-'));
const extension = path.join(root, 'dist/extension');
const context = await chromium.launchPersistentContext(profile, {
  channel:'chromium', headless:true, viewport:{width:1280,height:800},
  args:[`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});
const errors = [], requests = [];
let active = 0, peak = 0;
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (/^(www\.)?imdb\.com$/.test(url.hostname)) return route.fulfill({contentType:'text/html',body:fixtureHtml()});
  if (url.hostname === 'www.rottentomatoes.com') {
    const title = url.searchParams.get('search');
    requests.push(title); active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 70));
    const t = titles.find(t => t.title === title);
    active--;
    return route.fulfill({contentType:'text/html',body:t ? ratingHtml(t) : ''});
  }
  if (url.hostname === 'm.media-amazon.com') return route.abort();
  return route.fulfill({contentType:'text/html',body:'<!doctype html><h1>Unrelated page</h1>'});
});
const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
// Extension-owned service-worker fetches do not pass through Playwright's page router.
// Mock only the transport, keeping the packaged worker's message validation and fetch options.
async function mockWorkerTransport() {
  await worker.evaluate(responses => {
    globalThis.fixtureRequests = []; globalThis.fixtureActive = 0; globalThis.fixturePeak = 0;
    globalThis.fetch = async (url, options) => {
      if (options.credentials !== 'omit' || options.redirect !== 'error') throw new Error('Unsafe fetch options');
      const title = new URL(url).searchParams.get('search');
      fixtureRequests.push(title); fixtureActive++; fixturePeak = Math.max(fixturePeak, fixtureActive);
      await new Promise(resolve => setTimeout(resolve,70)); fixtureActive--;
      return new Response(responses[title] || '', {status:200});
    };
  }, Object.fromEntries(titles.map(t => [t.title,ratingHtml(t)])));
}
await mockWorkerTransport();
const requestCount = () => worker.evaluate(() => fixtureRequests.length);
const page = await context.newPage();
const host = page.locator('#imdb-poster-browser');
const $ = id => host.locator('#' + id);
const wait = async (predicate, label) => {
  for (let n = 0; n < 100; n++) { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve,50)); }
  throw new Error('Timed out: ' + label);
};
let checks = 0;
async function check(name, fn) {await fn(); checks++; console.log('PASS ' + name);}
try {
  await page.goto('https://www.imdb.com/name/nm9999999/');
  await check('clean installation without Tampermonkey; default IMDb sort and deduplicated credit roles', async () => {
    await $('launch').waitFor();
    await $('launch').click();
    await wait(async () => (await $('message').textContent()).includes('8 titles loaded'), 'additional credits');
    assert.equal(await host.locator('.poster-card').count(),7);
    assert.equal(await host.locator('.card strong').first().textContent(),'Alpha');
    assert.match(await host.locator('.credits').first().textContent(), /Actor: Lead · Writer: Screenplay/);
    assert.equal(await $('sort').inputValue(),'rating');
    assert.equal(await $('grid').isVisible(),true);
  });
  await check('all sort modes and Movies/All credits filter', async () => {
    await $('sort').selectOption('new'); assert.equal(await host.locator('.card strong').first().textContent(),'Golf');
    await $('sort').selectOption('old'); assert.equal(await host.locator('.card strong').first().textContent(),'Hotel');
    await $('sort').selectOption('title'); assert.equal(await host.locator('.card strong').first().textContent(),'Alpha');
    await $('type').selectOption('all'); assert.equal(await host.locator('.poster-card').count(),8);
    await $('sort').selectOption('rating'); assert.equal(await host.locator('.card strong').first().textContent(),'Alpha');
  });
  await check('RT matching, zero score, threshold, unavailable and ambiguous results, two-request limit', async () => {
    await $('sort').selectOption('rt');
    await wait(async () => !(await $('message').textContent()).includes('Loading RT ratings'), 'all RT ratings');
    assert.equal(await host.locator('.card strong').first().textContent(),'Bravo');
    const zero = host.locator('[data-title-id="tt1000001"] .rt-rating');
    assert.equal(await zero.isVisible(),true); assert.equal(await zero.getAttribute('data-sentiment'),'rotten');
    assert.match(await zero.textContent(),/0%/);
    assert.equal(await host.locator('[data-title-id="tt1000003"] .rt-rating').getAttribute('data-sentiment'),'fresh');
    for (const id of ['tt1000004','tt1000006','tt1000007']) assert.equal(await host.locator(`[data-title-id="${id}"] .rt-rating`).isVisible(),false);
    assert.ok(await requestCount() >= 8, 'Real service worker messages must reach the mocked transport');
    assert.ok(await worker.evaluate(() => fixturePeak) <= 2, 'At most two requests at once');
    const ordered = await host.locator('.poster-card').evaluateAll(cards => cards.map(c => c.dataset.titleId));
    assert.ok(ordered.indexOf('tt1000001') < ordered.indexOf('tt1000004'), '0% comes before unrated');
  });
  await check('local search, empty state, missing posters and poster click', async () => {
    await $('search').fill('does not exist'); assert.equal(await host.locator('.poster-card').count(),0);
    assert.match(await $('message').textContent(),/No matching titles/);
    await $('search').fill('alpha'); assert.equal(await host.locator('.poster-card').count(),1);
    await wait(async () => (await host.locator('.placeholder').count()) > 0,'failed poster fallback');
    await host.locator('.card').click();
    assert.equal(await $('viewer').isVisible(),true); assert.equal(await $('title').textContent(),'Alpha');
    assert.equal(await $('open').getAttribute('href'),'https://www.imdb.com/title/tt1000001/');
    assert.equal(await $('open').getAttribute('target'),'_blank');
    await $('search').fill('');
  });
  await check('single-poster arrows, Home/End, keyboard and swipe', async () => {
    await $('sort').selectOption('title');
    await $('close').focus(); await page.keyboard.press('Home'); assert.equal(await $('title').textContent(),'Alpha');
    await page.keyboard.press('ArrowRight'); assert.equal(await $('title').textContent(),'Bravo');
    await $('next').click(); assert.equal(await $('title').textContent(),'Charlie');
    await $('prev').click(); assert.equal(await $('title').textContent(),'Bravo');
    await $('close').focus(); await page.keyboard.press('End'); assert.equal(await $('title').textContent(),'Hotel');
    assert.equal(await $('next').isDisabled(),true);
    await page.keyboard.press('Home'); assert.equal(await $('prev').isDisabled(),true);
    const bounds = await $('stage').boundingBox();
    await page.mouse.move(bounds.x + bounds.width/2 + 80,bounds.y + bounds.height/2);
    await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width/2 - 80,bounds.y + bounds.height/2,{steps:5}); await page.mouse.up();
    assert.equal(await $('title').textContent(),'Bravo');
  });
  await check('Escape restores scrolling and focus; grid arrow scroll', async () => {
    await page.keyboard.press('Escape');
    await wait(async () => !(await host.locator('dialog').evaluate(el => el.open)), 'dialog close');
    await wait(async () => (await page.evaluate(() => document.documentElement.style.overflow)) === '', 'scroll restoration');
    assert.equal(await host.locator('dialog').evaluate(el => el.open),false);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow),'');
    assert.equal(await host.evaluate(el => el.shadowRoot.activeElement?.id),'launch');
    await $('launch').click(); await $('close').focus(); await page.keyboard.press('ArrowDown');
    await page.screenshot({path:path.join(out,'fixture-grid.png')});
  });
  await check('cache persists across reload and expired cache is refreshed', async () => {
    const before = await requestCount();
    await page.reload(); await $('launch').click(); await $('type').selectOption('all'); await $('sort').selectOption('rt');
    await wait(async () => !(await $('message').textContent()).includes('Loading RT ratings'),'cache');
    assert.equal(await requestCount(),before);
    await worker.evaluate(async () => {
      const saved = await chrome.storage.local.get('rt:tt1000001');
      saved['rt:tt1000001'].expires = 1; await chrome.storage.local.set(saved);
    });
    await page.reload(); await $('launch').click(); await $('sort').selectOption('rt');
    await wait(async () => await requestCount() > before,'expiry refetch');
  });
  await check('extension works after background worker restart', async () => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('ServiceWorker.enable'); await cdp.send('ServiceWorker.stopAllWorkers');
    await page.reload(); await $('launch').click();
    const restarted = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    await restarted.evaluate(() => chrome.storage.local.remove('rt:tt1000002'));
    await mockWorkerTransport();
    const before = await requestCount();
    await page.reload(); await $('launch').click(); await $('sort').selectOption('rt');
    await wait(async () => await requestCount() > before,'request after worker stop');
    await cdp.detach();
  });
  await check('no injection on unrelated pages or IMDb title pages', async () => {
    for (const url of ['https://example.com/','https://www.imdb.com/title/tt1000001/']) {
      const other = await context.newPage(); await other.goto(url);
      assert.equal(await other.locator('#imdb-poster-browser').count(),0); await other.close();
    }
  });
  await check('current IMDb opaque category IDs and label-based department accordions load all supported credits', async () => {
    const modern = await context.newPage();
    await modern.route('https://www.imdb.com/name/nm8888888/',route => route.fulfill({contentType:'text/html',body:modernFixtureHtml()}));
    await modern.goto('https://www.imdb.com/name/nm8888888/');
    const modernHost = modern.locator('#imdb-poster-browser');
    await modernHost.locator('#launch').click();
    await modernHost.locator('#type').selectOption('all');
    await wait(async () => (await modernHost.locator('#message').textContent()).includes('9 titles loaded'),'modern department loading');
    assert.equal(await modernHost.locator('.poster-card').count(),9);
    assert.equal(await modernHost.getByRole('button',{name:'View poster: India',exact:true}).count(),1);
    assert.equal(await modernHost.getByRole('button',{name:'View poster: Hotel',exact:true}).count(),1);
    assert.equal(await modernHost.getByRole('button',{name:'View poster: Excluded soundtrack',exact:true}).count(),0);
    await modern.close();
  });
  const original = await readFile(path.join(root,'imdb-poster-browser.user.js'),'utf8');
  await check('userscript arriving after the extension does not duplicate UI', async () => {
    await page.addScriptTag({content:original});
    assert.equal(await host.count(),1);
  });
  await check('userscript arriving first and userscript-only installation retain features', async () => {
    const plain = await chromium.launch({headless:true});
    try {
      const testPage = await plain.newPage();
      await testPage.route('**/*', route => route.fulfill({contentType:'text/html',body:fixtureHtml()}));
      await testPage.goto('https://www.imdb.com/name/nm9999999/');
      await testPage.evaluate(() => {
        window.GM_getValue = (_key, fallback) => fallback; window.GM_setValue = () => {};
        window.GM_xmlhttpRequest = options => options.onerror?.(new Error('Unavailable'));
      });
      await testPage.addScriptTag({content:original});
      const content = await readFile(path.join(extension,'content.js'),'utf8');
      await testPage.addScriptTag({content});
      assert.equal(await testPage.locator('#imdb-poster-browser').count(),1);
      await testPage.getByRole('button',{name:'Browse posters',exact:true}).click();
      assert.equal(await testPage.locator('#imdb-poster-browser').locator('#sort').inputValue(),'rating');
      await testPage.locator('#imdb-poster-browser').locator('#sort').selectOption('rt');
      await wait(async () => !(await testPage.locator('#imdb-poster-browser').locator('#message').textContent()).includes('Loading RT ratings'),'failed lookup fallback');
    } finally {await plain.close();}
  });
  assert.deepEqual(errors,[]);
  console.log(`${checks} browser scenarios passed. Worker transport was mocked; separate live verification checks real network requests.`);
} catch (error) {
  await page.screenshot({path:path.join(out,'failure.png')}).catch(() => {});
  console.error(JSON.stringify({requests,errors,message:await $('message').textContent(),worker:await worker.evaluate(() => ({requests:fixtureRequests}))},null,2));
  throw error;
} finally {await context.close();}
