import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {unzipSync} from 'fflate';

const root = fileURLToPath(new URL('../',import.meta.url));
const mime = {'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.zip':'application/zip'};
const server = createServer(async (request,response) => {
  const name = new URL(request.url,'http://localhost').pathname;
  const file = path.resolve(root,'.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root)) {response.writeHead(403).end(); return;}
  try {const body = await readFile(file); response.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(body);}
  catch {response.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless:true});
await mkdir(path.join(root,'output/playwright'),{recursive:true});
try {
  const context = await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage();
  for (const width of [1280,720,390]) {
    await page.setViewportSize({width,height:800}); await page.goto(base);
    assert.equal(await page.getByRole('heading',{name:'One extension. All the posters.'}).isVisible(),true);
    assert.equal(await page.getByRole('heading',{name:'Your browser. A better view.'}).isVisible(),true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`No horizontal overflow at ${width}px`);
    const anchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.hash.slice(1)));
    for (const id of anchors) assert.equal(await page.locator('[id="'+id+'"]').count(),1);
    await page.screenshot({path:path.join(root,`output/playwright/website-${width}.png`),fullPage:true});
  }
  await page.getByRole('button',{name:'Copy userscript'}).click();
  await page.waitForFunction(() => document.getElementById('copy-status').textContent.length > 0);
  assert.match(await page.locator('#copy-status').textContent(),/Copied!/);
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(clipboard.replace(/\r\n/g,'\n'),(await readFile(path.join(root,'imdb-poster-browser.user.js'),'utf8')).replace(/\r\n/g,'\n'));
  const archive = await fetch(base+'/downloads/voltura-imdb-poster-browser-1.5.1.zip');
  assert.equal(archive.status,200);
  assert.ok(unzipSync(new Uint8Array(await archive.arrayBuffer()))['manifest.json']);
  await page.getByRole('link',{name:'Privacy',exact:true}).click();
  assert.match(await page.title(),/Privacy/);
  assert.equal(await page.getByRole('heading',{name:'Local cache and retention'}).isVisible(),true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
  console.log('PASS website at 1280, 720 and 390px, both installation paths, anchors, original-script clipboard copy, ZIP download, privacy navigation.');
} finally {await browser.close(); await new Promise(resolve => server.close(resolve));}
