import {chromium} from 'playwright';
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const extension = path.join(root,'dist/extension');
const screenshots = path.join(root,'store/screenshots');
const output = path.join(root,'output/playwright');
await mkdir(screenshots,{recursive:true}); await mkdir(output,{recursive:true});
const profile = await mkdtemp(path.join(tmpdir(),'voltura-imdb-live-'));
const context = await chromium.launchPersistentContext(profile,{
  channel:'chromium',headless:true,viewport:{width:1280,height:800},
  args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]
});
const report = [];
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  for (const [id,label] of [['nm0000108','luc-besson'],['nm0000204','natalie-portman']]) {
    const page = await context.newPage();
    const entry = {id,label,url:`https://www.imdb.com/name/${id}/`}; report.push(entry);
    const response = await page.goto(entry.url,{waitUntil:'domcontentloaded',timeout:45000});
    entry.httpStatus = response?.status(); entry.pageTitle = await page.title();
    if (entry.httpStatus !== 200) throw new Error(`Live IMDb access returned HTTP ${entry.httpStatus}; verify in regular Chrome instead`);
    const host = page.locator('#imdb-poster-browser');
    await host.locator('#launch').waitFor({timeout:20000});
    await host.locator('#launch').click();
    await host.locator('.poster-card').first().waitFor({timeout:15000});
    // Give real image, credit and score requests time to finish; no network interception.
    await page.waitForTimeout(12000);
    entry.status = await host.locator('#message').textContent();
    entry.posters = await host.locator('.poster-card').count();
    entry.imagesLoaded = await host.locator('.card img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth > 0).length);
    entry.scores = await host.locator('.rt-rating:visible').count();
    entry.categories = await host.locator('.credits').allTextContents();
    entry.categories = [...new Set(entry.categories.flatMap(text => ['Actor','Actress','Writer','Producer','Director'].filter(category => text.includes(category))))];
    if (!entry.imagesLoaded) throw new Error('Live IMDb poster images did not load');
    await page.screenshot({path:path.join(screenshots,`${label}-grid.png`)});
    await host.locator('.card').first().click();
    await page.waitForTimeout(1500);
    entry.singlePosterTitle = await host.locator('#title').textContent();
    await page.screenshot({path:path.join(screenshots,`${label}-single.png`)});
    await page.keyboard.press('Escape');
    entry.closed = !(await host.locator('dialog').evaluate(dialog => dialog.open));
    console.log(JSON.stringify(entry));
    await page.close();
  }
  const cache = await worker.evaluate(() => chrome.storage.local.get(null));
  const results = Object.values(cache);
  const totals = {cached:results.length,rated:results.filter(result => result.score !== null).length};
  report.push(totals);
  console.log(JSON.stringify(totals));
  if (!totals.rated) throw new Error('No real Rotten Tomatoes scores were retrieved');
} catch (error) {
  report.push({error:error.message});
  console.error(error.message); process.exitCode = 1;
  const page = context.pages().at(-1);
  if (page) await page.screenshot({path:path.join(output,'live-failure.png')}).catch(()=>{});
} finally {
  await writeFile(path.join(output,'live-report.json'),JSON.stringify(report,null,2)+'\n');
  await context.close();
}
