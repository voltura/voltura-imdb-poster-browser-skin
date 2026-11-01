import sharp from 'sharp';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Original vector promotional artwork. Actual product captures stay unmodified.
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'store/promo');
const frames = path.join(root, 'output/promo');
await mkdir(out, {recursive:true});
await mkdir(frames, {recursive:true});
const icon = (x,y,s) => `<g transform="translate(${x} ${y}) scale(${s/64})"><rect width="64" height="64" rx="14" fill="#111113"/><g fill="#f5c518"><rect x="14" y="14" width="16" height="25" rx="3"/><rect x="34" y="14" width="16" height="25" rx="3"/><rect x="14" y="43" width="16" height="7" rx="2"/><rect x="34" y="43" width="16" height="7" rx="2"/></g></g>`;
function posters(x,y,scale=1) {
  const colors = [['#ed9449','#482667'],['#35c4c2','#142b67'],['#f5c518','#af412a'],['#7490f2','#382650'],['#e47c9f','#603754'],['#70b69d','#153d55']];
  return `<g transform="translate(${x} ${y}) scale(${scale})">` + colors.map(([a,b],i)=>{
    const px=(i%3)*130, py=Math.floor(i/3)*184;
    return `<g transform="translate(${px} ${py})"><rect width="112" height="165" rx="9" fill="${b}"/><path d="M0 130 L112 30 V165 H0Z" fill="${a}" opacity=".75"/><circle cx="${i%2 ? 70:38}" cy="52" r="24" fill="${a}"/><path d="M20 129Q56 58 92 129Z" fill="#111824" opacity=".8"/><rect x="13" y="140" width="67" height="4" rx="2" fill="#fff" opacity=".8"/><rect x="13" y="150" width="42" height="3" rx="1" fill="#fff" opacity=".45"/></g>`;
  }).join('') + '</g>';
}
const defs = `<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#161b2a"/><stop offset="1" stop-color="#090b11"/></linearGradient><radialGradient id="glow"><stop stop-color="#f5c518" stop-opacity=".25"/><stop offset="1" stop-color="#f5c518" stop-opacity="0"/></radialGradient></defs>`;
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}<rect width="${w}" height="${h}" fill="url(#bg)"/>${body}</svg>`;
const text = (x,y,size,content,color='#fff',weight=600) => `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${content}</text>`;
const small = svg(440,280,`<ellipse cx="100" cy="120" rx="180" ry="170" fill="url(#glow)"/>${posters(238,-30,.81)}<rect x="0" width="213" height="280" fill="#111622"/>${icon(29,27,76)}${text(29,137,26,'Voltura')}${text(29,171,19,'IMDb Poster')}${text(29,198,19,'Browser')}${text(29,248,12,'A better view of film.', '#f5c518')}`);
const marquee = svg(1400,560,`<ellipse cx="390" cy="280" rx="600" ry="500" fill="url(#glow)"/>${posters(840,-64,1.5)}${icon(76,66,100)}${text(201,128,26,'VOLTURA', '#f5c518')}${text(76,261,62,'IMDb Poster Browser')}${text(78,327,29,'Your filmography. A wall of posters.', '#d5dbea',400)}<rect x="78" y="382" width="61" height="4" rx="2" fill="#f5c518"/>${text(78,448,20,'Explore · Search · Sort · Discover', '#e6e8ee',400)}`);
for (const [name,source] of [['small-promo',small],['marquee-promo',marquee]]) {
  await writeFile(path.join(out,`${name}.svg`),source);
  await sharp(Buffer.from(source)).flatten({background:'#111622'}).removeAlpha().png().toFile(path.join(out,`${name}.png`));
}
const grid = await readFile(path.join(root,'store/screenshots/luc-besson-grid.jpg'));
const single = await readFile(path.join(root,'store/screenshots/luc-besson-single.jpg'));
const image = (data,x,y,w,h)=>`<image href="data:image/jpeg;base64,${data.toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const brand = `${icon(68,51,62)}${text(149,92,23,'VOLTURA', '#f5c518')}`;
const slides = [
  svg(1920,1080,`<ellipse cx="560" cy="500" rx="750" ry="650" fill="url(#glow)"/>${posters(1250,-50,2.3)}${icon(96,92,124)}${text(96,334,32,'VOLTURA', '#f5c518')}${text(96,466,76,'IMDb Poster')}${text(96,557,76,'Browser')}${text(100,676,34,'See a filmography in a whole new way.', '#d5dbea',400)}${text(100,931,25,'Free Chrome extension · By Voltura AB', '#f5c518',400)}`),
  svg(1920,1080,`${brand}${text(68,189,48,'A whole filmography. One poster grid.')}${text(70,243,26,'Acting, writing, producing and directing credits — together.', '#c3cbdc',400)}${image(grid,320,285,1280,800)}`),
  svg(1920,1080,`${brand}${text(68,189,48,'Find your next film faster.')}${text(70,243,26,'Search titles, filter credits and choose from five sort orders.', '#c3cbdc',400)}${image(grid,320,285,1280,800)}<rect x="346" y="376" width="1215" height="65" rx="10" fill="none" stroke="#f5c518" stroke-width="5"/>`),
  svg(1920,1080,`${brand}${text(68,189,48,'One poster at a time. All the details.')}${text(70,243,26,'Explore available IMDb and Rotten Tomatoes scores. Navigate with arrow keys.', '#c3cbdc',400)}${image(single,320,285,1280,800)}`),
  svg(1920,1080,`<ellipse cx="960" cy="500" rx="900" ry="700" fill="url(#glow)"/>${icon(882,117,156)}${text(428,410,62,'Voltura IMDb Poster Browser')}${text(522,498,34,'Your browser. A better view.', '#d5dbea',400)}<rect x="580" y="594" width="760" height="104" rx="20" fill="#f5c518"/>${text(709,661,36,'Discover it at imdb.voltura.se', '#15161a')}${text(577,792,27,'Free Chrome extension · No account required', '#d5dbea',400)}${text(625,961,19,'Independent software by Voltura AB.', '#929eb4',400)}${text(483,996,17,'Not affiliated with IMDb or Rotten Tomatoes. Scores depend on availability.', '#929eb4',400)}`)
];
for (let i=0;i<slides.length;i++) await sharp(Buffer.from(slides[i])).png().toFile(path.join(frames,`scene-${i}.png`));
await sharp(Buffer.from(slides[0])).resize(1280,720).jpeg({quality:92}).toFile(path.join(out,'video-thumbnail.jpg'));
const ffmpeg=process.env.FFMPEG_PATH;
if (ffmpeg) {
  const inputs=slides.flatMap((_,i)=>['-loop','1','-t','6','-i',path.join(frames,`scene-${i}.png`)]);
  const filters=slides.map((_,i)=>`[${i}:v]scale=1920:1080,setsar=1,fps=30,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35[v${i}]`).join(';')+';'+slides.map((_,i)=>`[v${i}]`).join('')+'concat=n=5:v=1:a=0[out]';
  const result=spawnSync(ffmpeg,['-y',...inputs,'-filter_complex',filters,'-map','[out]','-c:v','libx264','-preset','fast','-crf','19','-movflags','+faststart',path.join(out,'voltura-imdb-poster-browser-promo.mp4')],{stdio:'inherit'});
  if(result.status!==0) throw new Error('Video encoding failed');
}
console.log('Promo tiles, source vectors, thumbnail and five 1080p video scenes generated. Set FFMPEG_PATH to also encode the 30-second MP4.');
