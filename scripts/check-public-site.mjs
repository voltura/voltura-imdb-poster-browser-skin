import assert from 'node:assert/strict';

const base = new URL('https://imdb.voltura.se/');
async function request(url, method = 'GET') {
  const response = await fetch(url, {method, signal:AbortSignal.timeout(30000)});
  assert.equal(response.status, 200, `${method} ${url}: HTTP ${response.status}`);
  return response;
}
const home = await (await request(base)).text();
assert.match(home, /<link rel="canonical" href="https:\/\/imdb\.voltura\.se\/"/);
assert.doesNotMatch(home, /<meta[^>]+content="[^"]*noindex/i);
assert.match(home, /utm_source=imdb\.voltura\.se/);
assert.match(home, /<video\b/);
const app = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || 'null');
assert.equal(app?.name, 'Voltura IMDb Poster Browser');
const robots = await (await request(new URL('robots.txt', base))).text();
assert.match(robots, /Sitemap: https:\/\/imdb\.voltura\.se\/sitemap\.xml/);
const sitemap = await (await request(new URL('sitemap.xml', base))).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
assert.ok(urls.length > 0, 'Sitemap has pages');
for (const url of urls) {
  assert.equal(url.origin, base.origin, 'Sitemap URLs stay on the product site');
  await request(url);
}
// Check the published files rather than an extension installation or third-party rating service.
const assets = new Set([...home.matchAll(/(?:src|poster)="([^"?#]+)(?:[^\"]*)"/g)]
  .map(match => match[1]).filter(value => !value.startsWith('https:')));
for (const match of home.matchAll(/assets\/poster-browser-\d+\.webp/g)) assets.add(match[0]);
for (const asset of assets) await request(new URL(asset, base), 'HEAD');
const verification = await (await request(new URL('google73b3a93076426b87.html', base))).text();
assert.equal(verification.trim(), 'google-site-verification: google73b3a93076426b87.html');
console.log(`PASS public website: metadata, campaign links, ${urls.length} sitemap pages and ${assets.size} media files.`);
