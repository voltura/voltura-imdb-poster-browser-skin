# Voltura IMDb Poster Browser

Browse a person's IMDb acting, writing, producing, and directing filmography as a poster grid or one poster at a time, without leaving their page.

Visit the [product page](https://imdb.voltura.se/) for a preview and installation steps.

Two free installation methods offer the same features: a standalone Chrome extension and the original Tampermonkey userscript.

## Standalone Chrome extension

The Chrome Web Store listing is not published yet. The downloadable extension works without Tampermonkey:

1. Download [version 1.5.0](https://imdb.voltura.se/downloads/voltura-imdb-poster-browser-1.5.0.zip) and extract the ZIP into a folder you will keep.
2. Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the extracted folder containing `manifest.json`.
3. Open or refresh an IMDb person page and click **Browse posters**.

To update this unpacked installation, extract the latest ZIP into the same folder, reload the extension at `chrome://extensions`, and refresh IMDb. Once the store version is published, Chrome will manage updates for installations from the store.

Only IMDb person-page access, Rotten Tomatoes access, and local storage are used. See the [privacy policy](https://imdb.voltura.se/privacy.html).

If both methods are installed, the first to start supplies the interface and the other skips it. To choose which one runs, disable the other and refresh IMDb. Rating caches remain separate.

## Tampermonkey userscript — install in Google Chrome

1. Install the **Tampermonkey** extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. Open `chrome://extensions` in Chrome's address bar. Find **Tampermonkey**, click **Details**, and turn on **Allow User Scripts**.
3. Open [imdb-poster-browser.user.js](imdb-poster-browser.user.js) in this repository. Click the **Copy raw file** button to copy the entire script.
4. Click Chrome's **Extensions** puzzle icon, select **Tampermonkey**, and choose **Create a new script…**.
5. Delete all the example code in the editor, then paste the script you copied. Press **Ctrl+S** to save it. Make sure the script is enabled in the Tampermonkey dashboard.
6. Open or refresh a person's page on [IMDb](https://www.imdb.com/). Click **Browse posters** in the bottom-right corner.

If the button does not appear, check that Tampermonkey and the script are enabled, **Allow User Scripts** is on, and Tampermonkey has permission to run on IMDb. Then refresh the actor's page. See [Tampermonkey's permission guide](https://www.tampermonkey.net/faq.php#Q209) for help.

## How to use

- The **Poster grid** opens by default. Use **↑** / **↓** to scroll, or scroll normally. Select a poster to open it on its own.
- In the single-poster view, use **←** / **→**, the large arrows, or swipe to browse. The full-height areas on either side of the poster are clickable and highlight in gold on hover. **Home** and **End** jump to the first and last title.
- Search by title, choose **Movies** or **All credits**, and sort by newest, oldest, title, **IMDb rating ↓**, or **Rotten Tomatoes rating ↓**. Highest IMDb rating is the default. Unrated titles appear last when sorting by rating, including films with a 0% RT score above those without a score.
- Posters that are missing or fail to load show the title and year instead.
- Compact Rotten Tomatoes score links sit beside the year and IMDb score below posters, with a red tomato for **Fresh** (60% or higher) and a green splat for **Rotten** (below 60%). Hover for the full meaning. Links appear only when a critic score is available. Ratings normally load as posters come into view and are cached for 24 hours. Choosing **Rotten Tomatoes rating ↓** loads ratings for all matching titles and updates their order as results arrive; progress appears above the posters. Matches require the same title and release year.
- Remaining acting, writing, producing, and directing credits load automatically when you open the poster browser. Progress appears above the posters.
- Click **Open movie** to open the title's IMDb page in a new tab. Press **Esc** or click **×** to close the browser.

Each poster shows the person’s credit categories and available role details in both views. Titles shared by several categories appear once.

The script uses the acting, writing, producing, and directing credits available on the IMDb page. It runs on person pages (`imdb.com/name/nm…`). Tampermonkey also requests access to `www.rottentomatoes.com` to retrieve critic scores, without an API key. IMDb or Rotten Tomatoes page changes may affect it.

## Update the userscript

Copy the latest contents of [imdb-poster-browser.user.js](imdb-poster-browser.user.js), replace the code in your existing Tampermonkey script, save with **Ctrl+S**, and refresh IMDb. Keep only one copy enabled. Allow access to `www.rottentomatoes.com` if Tampermonkey asks.

This project is independent of IMDb, Rotten Tomatoes, and Tampermonkey. Poster images and title information come from IMDb; critic scores come from Rotten Tomatoes.

## Develop and package

Requires Node.js 24 or later. Run `npm ci`, `npm run build`, `npm test`, then `node node_modules/playwright/cli.js install chromium`, `npm run test:browser`, and `npm run test:website`.

The root userscript is the shared feature source and is not rewritten by the build. `extension/adapter.js` wraps its unchanged body with Chrome storage and messaging adapters. `extension/worker.js` performs anonymous, restricted Rotten Tomatoes requests. All executable code ships inside the package.

The build generates `dist/extension/` for unpacked testing, a versioned ZIP and SHA-256 digest in `dist/`, and a downloadable ZIP in `downloads/`. The ZIP is deterministic for the same inputs and dependencies. Keep the userscript, package, and manifest versions in sync. Store publication materials and status are in [store/README.md](store/README.md).
