import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {zipSync} from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(path.join(root, name), 'utf8');
const manifest = JSON.parse(await read('extension/manifest.json'));
const script = (await read('imdb-poster-browser.user.js')).replace(/\r\n/g, '\n');
const version = script.match(/^\/\/ @version\s+(\S+)/m)?.[1];
if (version !== manifest.version || version !== JSON.parse(await read('package.json')).version) {
  throw new Error('Userscript, manifest and package versions must match');
}
const body = script.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/, '');
if (body === script) throw new Error('Userscript metadata not found');
const adapter = (await read('extension/adapter.js')).replace(/\r\n/g, '\n');
const files = {
  'manifest.json': Buffer.from(JSON.stringify(manifest, null, 2) + '\n'),
  'content.js': Buffer.from(adapter + body + '\n})();\n'),
  'worker.js': Buffer.from((await read('extension/worker.js')).replace(/\r\n/g, '\n'))
};
// Render the existing vector artwork; transparent padding meets store-icon guidance.
const artwork = await readFile(path.join(root, 'assets/favicon.svg'));
for (const size of [16, 32, 48, 128]) {
  const inner = size === 128 ? 96 : size;
  const padding = (size - inner) / 2;
  files[`icons/${size}.png`] = await sharp(artwork).resize(inner, inner)
    .extend({top: padding, bottom: padding, left: padding, right: padding, background: '#00000000'}).png().toBuffer();
}
const out = path.join(root, 'dist/extension');
for (const [name, bytes] of Object.entries(files)) {
  await mkdir(path.dirname(path.join(out, name)), {recursive: true});
  await writeFile(path.join(out, name), bytes);
}
// A fixed timestamp and ordering make ZIP output identical for identical inputs.
const zipped = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))
  .map(([name, bytes]) => [name, [bytes, {mtime: new Date('2020-01-01T00:00:00Z')}]]));
const archive = Buffer.from(zipSync(zipped, {level: 9}));
const zipName = `voltura-imdb-poster-browser-${version}.zip`;
await writeFile(path.join(root, 'dist', zipName), archive);
const digest = createHash('sha256').update(archive).digest('hex');
await writeFile(path.join(root, 'dist', zipName + '.sha256'), `${digest}  ${zipName}\n`);
await mkdir(path.join(root, 'downloads'), {recursive: true});
await copyFile(path.join(root, 'dist', zipName), path.join(root, 'downloads', zipName));
console.log(`Built ${zipName} (${archive.length} bytes)\nSHA-256 ${digest}`);
