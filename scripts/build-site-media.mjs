import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const width of [640, 1280, 1920]) {
  const output = path.join(root, `assets/poster-browser-${width}.webp`);
  const result = await sharp(path.join(root, 'assets/poster-browser.png'))
    .resize({width, withoutEnlargement:true}).webp({quality:82}).toFile(output);
  console.log(`${width}px: ${result.size} bytes`);
}
