# Chrome Web Store submission — 1.5.1

## Status

- Extension ID: not assigned (no item uploaded yet).
- Review status: not submitted.
- Intended distribution: free, public, all available regions; publish automatically after approval.
- Package: `dist/voltura-imdb-poster-browser-1.5.1.zip` (run `npm run build`).
- Publisher dashboard: https://chrome.google.com/webstore/devconsole

Update this status only after the dashboard confirms an upload or submission. Do not describe the product as available in the store until the public listing is accessible.

## Listing

Name: **Voltura IMDb Poster Browser**

Summary: Browse IMDb filmographies as posters. Search and sort acting, writing, producing and directing credits with IMDb and RT scores.

Language: English. Category: Entertainment (or the closest available entertainment category in the dashboard).

Description:

Turn an IMDb person’s filmography into a wall of posters, without leaving their page.

- Browse acting, writing, producing, and directing credits in a poster grid or one poster at a time.
- Search titles, choose Movies or All credits, and sort by IMDb score, Rotten Tomatoes critic score, newest, oldest, or title.
- See available credit roles and both ratings beside each poster. Shared titles appear once.
- Remaining credits load automatically. Missing posters show the title and year.
- Navigate with arrow keys, Home/End, clickable side arrows, and swipes. Open a title on IMDb or a critic score on Rotten Tomatoes.

Open any IMDb person page and click Browse posters in the bottom-right corner. The grid opens with the highest IMDb ratings first. No Tampermonkey, account, subscription, or API key is required.

Rotten Tomatoes scores load on demand and are cached locally for 24 hours. Sorting by Rotten Tomatoes loads scores for matching titles. Matching requires the same title and release year; unavailable scores remain hidden. Site changes or unavailable third-party responses may affect results.

Free, independent software by Voltura. Not affiliated with IMDb, Rotten Tomatoes, or Tampermonkey. Film information and poster artwork come from IMDb; critic scores come from Rotten Tomatoes.

Website: https://imdb.voltura.se/

Support: https://github.com/voltura/voltura-imdb-poster-browser-skin/issues

Privacy policy: https://imdb.voltura.se/privacy.html

## Images

- Store icon: `dist/extension/icons/128.png`.
- Screenshots: `store/screenshots/luc-besson-grid.jpg` and `store/screenshots/luc-besson-single.jpg` — actual standalone extension on live IMDb, at 1280 × 800. No userscript or fixture screenshots are used for the store listing.

## Privacy and permissions

Single purpose: Display and browse an IMDb person’s filmography as posters with credit details and IMDb/Rotten Tomatoes ratings.

- `storage`: Cache Rotten Tomatoes matches and scores locally for 24 hours, reducing repeated requests.
- IMDb person-page content scripts: Read displayed filmography data, load remaining supported credits, and add the poster browser on person pages only.
- `https://www.rottentomatoes.com/*`: Retrieve critic-score search results directly from Rotten Tomatoes. The worker constructs a fixed search endpoint from a title, omits credentials, rejects redirects, and accepts messages only from this extension’s top-level IMDb person content script.
- Remote executable code: No. All JavaScript is in the uploaded package; remote HTML is parsed as data and is never executed.

Disclose **Website content** as handled, including locally processed IMDb credit data and Rotten Tomatoes results. Describe film-title queries sent directly to Rotten Tomatoes and its receipt of ordinary network information. If the dashboard asks separately about browsing activity, disclose processing of the current supported IMDb person page to provide this feature; no history database is read or browsing history retained. Do not claim no data handling merely because Voltura has no backend. No advertising, sale, unrelated use, analytics, or human review of users’ data. Match the final dashboard wording to the published privacy policy and implementation.

## Reviewer instructions

No credentials or special setup are required. Install the extension, then open https://www.imdb.com/name/nm0000108/ (Luc Besson) or https://www.imdb.com/name/nm0000204/ (Natalie Portman), refresh if the page was already open, and click Browse posters at the bottom right.

Verify the default poster grid and IMDb ordering, search and Movies/All credits filter, every sort option, automatic credit loading and credit roles. Select a poster, use arrow keys or side arrows, Home/End, open IMDb/Rotten Tomatoes links, and close with Escape. Rotten Tomatoes scores require network access and matching third-party results; missing scores are expected for unmatched titles. No Tampermonkey is required.

## Publication checklist

1. Run build, unit tests, controlled-browser tests, and live checks; record results in `store/validation.md`.
2. Verify the public privacy URL and ZIP download after publishing the repository’s GitHub Pages changes.
3. Sign in to the publisher dashboard; complete registration or account verification if required. Account agreements and payments are completed by the account owner when needed.
4. Upload the versioned ZIP, listing text, icon, and genuine extension screenshots. Fill privacy disclosures and verify every permission justification.
5. Choose free, public distribution and automatic publication after approval; submit for review.
6. Record the confirmed extension ID, version and review status here. Once public, add the real store URL as the primary installation route on the website and in the README, retaining the userscript route.
