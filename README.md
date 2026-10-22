# Voltura IMDb Poster Browser Skin

Browse an actor's IMDb filmography as a poster grid or one poster at a time, without leaving their page.

Visit the [product page](https://imdb.voltura.se/) for a preview and installation steps.

## Install in Google Chrome

1. Install the **Tampermonkey** extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. Open `chrome://extensions` in Chrome's address bar. Find **Tampermonkey**, click **Details**, and turn on **Allow User Scripts**.
3. Open [imdb-poster-browser.user.js](imdb-poster-browser.user.js) in this repository. Click the **Copy raw file** button to copy the entire script.
4. Click Chrome's **Extensions** puzzle icon, select **Tampermonkey**, and choose **Create a new script…**.
5. Delete all the example code in the editor, then paste the script you copied. Press **Ctrl+S** to save it. Make sure the script is enabled in the Tampermonkey dashboard.
6. Open or refresh an actor's page on [IMDb](https://www.imdb.com/). Click **Browse posters** in the bottom-right corner.

If the button does not appear, check that Tampermonkey and the script are enabled, **Allow User Scripts** is on, and Tampermonkey has permission to run on IMDb. Then refresh the actor's page. See [Tampermonkey's permission guide](https://www.tampermonkey.net/faq.php#Q209) for help.

## How to use

- The **Poster grid** opens by default. Use **↑** / **↓** to scroll, or scroll normally. Select a poster to open it on its own.
- In the single-poster view, use **←** / **→**, the on-screen arrows, or swipe to browse. **Home** and **End** jump to the first and last title.
- Search by title, choose **Movies** or **All acting credits**, and sort by newest, oldest, title, or **Highest rated**. Unrated titles appear last when sorting by rating.
- Posters that are missing or fail to load show the title and year instead.
- Remaining acting credits load automatically when you open the poster browser. Progress appears above the posters.
- Click **Open movie** to open the title's IMDb page in a new tab. Press **Esc** or click **×** to close the browser.

The script uses the acting credits currently available on the IMDb page. It runs on actor/person pages (`imdb.com/name/nm…`). IMDb page changes may affect it.

## Update

Copy the latest contents of [imdb-poster-browser.user.js](imdb-poster-browser.user.js), replace the code in your existing Tampermonkey script, save with **Ctrl+S**, and refresh IMDb.

This project is independent of IMDb and Tampermonkey. Poster images and title information come from IMDb.
