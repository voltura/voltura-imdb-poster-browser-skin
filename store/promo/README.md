# Store promotional assets

- `small-promo.png`: 440 × 280, RGB PNG without alpha.
- `marquee-promo.png`: 1400 × 560, RGB PNG without alpha.
- Matching SVG files preserve the original vector artwork, based on the existing Voltura poster-grid icon. The decorative posters are original abstract illustrations, not product screenshots.
- `voltura-imdb-poster-browser-promo.mp4`: approximately 30 seconds, 1920 × 1080, H.264 at 30 fps. Silent, with readable English captions and fades. The product scenes use the genuine standalone-extension screenshots in `store/screenshots/`.
- `video-thumbnail.jpg`: 1280 × 720 title-card thumbnail.

Run `npm run build:promo` to rebuild the tiles, thumbnail and scene PNGs. To encode the MP4 too, set `FFMPEG_PATH` to an installed FFmpeg binary before running the command. Scene PNGs are written to ignored `output/promo/`.

YouTube promo: **https://www.youtube.com/watch?v=2qSl6gYvuIM**. Uploaded on 1 November 2026 to the owner's Joakim Skoglund channel as **unlisted**, with embedding enabled. YouTube confirmed publication and completed its copyright checks with no issues found. The global promo video URL was saved in the store draft. Custom thumbnails require additional channel phone verification, so the generated thumbnail remains an optional local asset.

Validation: both tile dimensions, RGB/no-alpha format and full MP4 decoding passed. Representative title, grid, detail and closing scenes were visually inspected. Both tiles and the video URL were saved in the publisher dashboard on 1 November 2026. Because Google blocks changes during an existing review, the owner explicitly requested cancellation and resubmission. Google accepted the complete listing for review at approximately 21:51 CET that day; status **Pending review**, with automatic publication after approval checked. The extension package remains version 1.5.1.
