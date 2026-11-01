# Chrome Web Store submission — 1.5.1

## Status

- Extension ID: `enkeicnpgjfgaacchhbbdfhiblogekgb`.
- Review status: **Pending review**; version **1.5.1** submitted on **1 November 2026**. The dashboard confirmed “Your extension was submitted for review.”
- Resubmitted on **1 November 2026 at approximately 21:51 CET** with the global promo video and both promo tiles, after the owner requested cancellation of the earlier review. Google confirmed the new submission; automatic publication after approval remained checked.
- Product developer: Voltura AB.
- Distribution: **free of charge**, **public**, **all regions**. **Publish automatically after review** was checked when submitting.
- Package: `dist/voltura-imdb-poster-browser-1.5.1.zip` (run `npm run build`).
- Publisher dashboard: https://chrome.google.com/webstore/devconsole/875eeba0-33ce-400d-b5d0-5b5b68abd0be/enkeicnpgjfgaacchhbbdfhiblogekgb/edit

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

Open any IMDb person page and click Browse posters in the bottom-right corner. The grid opens with the highest IMDb ratings first. No account, subscription, or API key is required.

Rotten Tomatoes scores load on demand and are cached locally for 24 hours. Sorting by Rotten Tomatoes loads scores for matching titles. Matching requires the same title and release year; unavailable scores remain hidden. Site changes or unavailable third-party responses may affect results.

Free, independent software by Voltura AB. Not affiliated with IMDb or Rotten Tomatoes. Film information and poster artwork come from IMDb; critic scores come from Rotten Tomatoes.

Website: https://imdb.voltura.se/

Support: https://github.com/voltura/voltura-imdb-poster-browser-skin/issues

Privacy policy: https://imdb.voltura.se/privacy.html

## Images

- Store icon: `dist/extension/icons/128.png`.
- Screenshots: `store/screenshots/luc-besson-grid.jpg` and `store/screenshots/luc-besson-single.jpg` — actual standalone extension on live IMDb, at 1280 × 800. No userscript or fixture screenshots are used for the store listing.
- Promotional assets: `store/promo/small-promo.png` (440 × 280), `store/promo/marquee-promo.png` (1400 × 560), and the approximately 30-second 1080p promo MP4. Original vectors and reproducible generation instructions are in `store/promo/README.md`. Both tiles and the global video URL were saved before the confirmed resubmission on 1 November 2026.
- Global promo video: https://www.youtube.com/watch?v=2qSl6gYvuIM — unlisted on the owner's Joakim Skoglund channel, embedding enabled. YouTube confirmed publication and completed copyright checks with no issues found.

## Privacy and permissions

Single purpose: Display and browse an IMDb person’s filmography as posters with credit details and IMDb/Rotten Tomatoes ratings.

- `storage`: Cache Rotten Tomatoes matches and scores locally for 24 hours, reducing repeated requests.
- IMDb person-page content scripts: Read displayed filmography data, load remaining supported credits, and add the poster browser on person pages only.
- `https://www.rottentomatoes.com/*`: Retrieve critic-score search results directly from Rotten Tomatoes. The worker constructs a fixed search endpoint from a title, omits credentials, rejects redirects, and accepts messages only from this extension’s top-level IMDb person content script.
- Remote executable code: No. All JavaScript is in the uploaded package; remote HTML is parsed as data and is never executed.

Submitted data disclosure: **Website content**. IMDb credit data and Rotten Tomatoes results are processed locally; film-title queries go directly to Rotten Tomatoes, which receives ordinary network information. **Web history** is unchecked because the extension does not collect a list of visited pages, retain a browsing history, or read the browser history database. No personally identifiable user information, health/payment/authentication data, communications, location data, or activity logging is collected. All three limited-use certifications were checked. The published privacy policy explains this handling; no claim of zero data handling is made merely because Voltura AB has no backend.

## Reviewer instructions

No credentials or special setup are required. Install the extension, then open https://www.imdb.com/name/nm0000108/ (Luc Besson) or https://www.imdb.com/name/nm0000541/ (Bette Midler), refresh if the page was already open, and click Browse posters at the bottom right.

Verify the default poster grid and IMDb ordering, search and Movies/All credits filter, every sort option, automatic credit loading and credit roles. Select a poster, use arrow keys or side arrows, Home/End, open IMDb/Rotten Tomatoes links, and close with Escape. Rotten Tomatoes scores require network access and matching third-party results; missing scores are expected for unmatched titles.

## Publication checklist

1. Run build, unit tests, controlled-browser tests, and live checks; record results in `store/validation.md`.
2. Verify the public privacy URL and ZIP download after publishing the repository’s GitHub Pages changes.
3. Sign in to the publisher dashboard; complete registration or account verification if required. Account agreements and payments are completed by the account owner when needed.
4. Upload the versioned ZIP, listing text, icon, and genuine extension screenshots. Fill privacy disclosures and verify every permission justification.
5. Choose free, public distribution and automatic publication after approval; submit for review.
6. Record the confirmed extension ID, version and review status here. Once public, add the real store URL as the primary installation route on the website and in the README, retaining the userscript route.
