# Validation — extension 1.5.1

Date: 1 November 2026.

- `npm run build`: passed. ZIP includes a root manifest, content script, module service worker and 16/32/48/128px PNG icons. No dependencies or remote executable code are shipped.
- Package SHA-256: `4019fa562a81081f1ab6e176a6767183d535743e3670e7ebcee6b1f312c36e61`.
- `npm test`: 13 tests passed for sender and destination restrictions, anonymous requests, HTTP/permission failures, timeout/abort, worker initialization, storage hydration/failure/expiry, and exact shared userscript body in the ZIP.
- `npm run test:browser`: 12 scenarios passed in a clean Chromium profile with the actual unpacked extension, without Tampermonkey. Covered every sort, search, Movies/All credits, added credits and merged roles, current opaque category IDs and label-based accordions, RT 0% and 60% thresholds, missing/ambiguous/year-mismatched RT results, two-request concurrency, missing posters, navigation/swipe, closing/focus/scroll restoration, cache reload/expiry, worker stop/restart, URL restrictions, and duplicate prevention in either installation order. Rotten Tomatoes transport was mocked for deterministic results; these tests do not establish live third-party availability.
- Userscript-only behavior: passed with Tampermonkey API stand-ins, including graceful RT request failure. Version 1.5.1 adds a shared compatibility fix after live verification found that IMDb now uses opaque department IDs and label-based accordions; both installation methods receive the same fix.
- `npm run test:website`: passed at 1280, 720 and 390px, including both installation methods, no horizontal overflow, installation anchors, copying the original userscript, ZIP download and privacy navigation. Mobile screenshot and icon visually inspected.
- `npm audit`: installation reported zero vulnerabilities; production-dependency audit also passed.
- `git diff --check`: passed.

## Live checks and publication

- Separate headless Chromium live check: IMDb returned HTTP 403 for Luc Besson. This is not a functional live-data pass. No fixture screenshots are used as store screenshots.
- Regular Chrome: the user installed the standalone extension and disabled the userscript. Real IMDb posters and Rotten Tomatoes scores loaded. After reloading version 1.5.1, Luc Besson's credits loaded automatically from 40 to 135 unique titles, including 106 movie titles. Single-poster view displayed The Fifth Element, IMDb 7.6 and RT 71%; closing restored the page. Genuine 1280 × 800 JPEG screenshots of the grid and single-poster view are in `store/screenshots/`.
- GitHub Pages: commit `b8092cf` built successfully. Product page, privacy page and versioned ZIP returned HTTP 200. Downloaded ZIP SHA-256 matches the tested package.
- Real Rotten Tomatoes request through `createRatingHandler` with native Node fetch: passed, returning 111,384 characters of search HTML with media rows for The Fifth Element. This verifies the remote endpoint and worker request code, but not Chrome host-permission enforcement or live IMDb parsing.
- Store submission: pending. See `store/README.md` for the current confirmed store status.
