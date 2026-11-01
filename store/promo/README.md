# Store promotional assets

- `small-promo.png`: 440 × 280, RGB PNG without alpha.
- `marquee-promo.png`: 1400 × 560, RGB PNG without alpha.
- Matching SVG files preserve the original vector artwork, based on the existing Voltura poster-grid icon. The decorative posters are original abstract illustrations, not product screenshots.
- `voltura-imdb-poster-browser-promo.mp4`: approximately 30 seconds, 1920 × 1080, H.264 at 30 fps. Silent, with readable English captions and fades. The product scenes use the genuine standalone-extension screenshots in `store/screenshots/`.
- `video-thumbnail.jpg`: 1280 × 720 title-card thumbnail.

Run `npm run build:promo` to rebuild the tiles, thumbnail and scene PNGs. To encode the MP4 too, set `FFMPEG_PATH` to an installed FFmpeg binary before running the command. Scene PNGs are written to ignored `output/promo/`.

The YouTube promo is intended to be **unlisted** on the owner's Joakim Skoglund channel, with embedding enabled, for the Chrome Web Store global promo video field. Do not mark the store video as available until the upload and saved listing URL have been verified.

Validation: both tile dimensions, RGB/no-alpha format and full MP4 decoding passed. Representative title, grid, detail and closing scenes were visually inspected. Both tiles were uploaded and saved as **draft assets** in the publisher dashboard on 1 November 2026. Google displays “You may not edit or publish an item that is in review.” These assets are not yet confirmed as part of a submitted listing revision; the existing extension review remains pending.
