// ==UserScript==
// @name         IMDb Poster Browser
// @namespace    voltura.imdb.poster-browser
// @version      1.4.2
// @description  Browse an actor's film posters in a grid or swipeable viewer without leaving their page.
// @match        https://www.imdb.com/name/nm*
// @match        https://imdb.com/name/nm*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      www.rottentomatoes.com
// ==/UserScript==

(() => {
  'use strict';
  const hostId = 'imdb-poster-browser';
  if (document.getElementById(hostId)) return;
  const host = document.createElement('div');
  host.id = hostId;
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `
    <style>
      :host {font:16px/1.4 system-ui,sans-serif;color:#f5f5f5}
      * {box-sizing:border-box}
      button,input,select,a {font:inherit}
      button,select,a {cursor:pointer}
      button,a {touch-action:manipulation}
      button {border:1px solid #555;background:#262626;color:#fff;border-radius:9px;padding:10px 16px;min-height:44px}
      button:hover,a:hover {background:#414141}
      button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible {outline:3px solid #f5c518;outline-offset:3px}
      button:disabled {opacity:.35;cursor:default}
      #launch {position:fixed;right:22px;bottom:24px;z-index:2147483646;background:#f5c518;color:#111;border:0;font-weight:750;box-shadow:0 4px 24px #0008}
      dialog {color:#fff;background:#101012;border:1px solid #414145;border-radius:14px;padding:0;width:calc(100vw - 32px);max-width:1500px;height:calc(100dvh - 32px);max-height:none;overflow:hidden}
      dialog::backdrop {background:#000d}
      .shell {height:100%;display:flex;flex-direction:column}
      header {display:flex;gap:12px;align-items:center;padding:12px 18px;border-bottom:1px solid #333}
      h2 {margin:0;font-size:20px;flex:1}
      #actor {color:#f5c518}
      #close {font-size:24px;line-height:1;padding:6px 14px}
      .tools {display:flex;gap:10px;flex-wrap:wrap;padding:12px 18px}
      input,select {color:#fff;background:#222;border:1px solid #555;padding:9px 12px;border-radius:8px;min-height:44px}
      input {flex:1;min-width:140px}
      #message {padding:0 18px 10px;color:#bdbdc5;font-size:13px}
      #content {flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-color:#686873 #18181d;scrollbar-width:thin;color-scheme:dark}
      #content::-webkit-scrollbar {width:10px;height:10px}
      #content::-webkit-scrollbar-track {background:#18181d;border-radius:8px}
      #content::-webkit-scrollbar-thumb {background:#686873;border:2px solid #18181d;border-radius:8px}
      #content::-webkit-scrollbar-thumb:hover {background:#f5c518}
      kbd {display:inline-block;min-width:22px;padding:0 5px;border:1px solid #55555f;border-bottom-width:3px;border-radius:4px;background:#26262d;color:#f5f5f5;font:inherit;text-align:center}
      #grid {padding:8px 18px 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:20px}
      .card {border:0;background:transparent;padding:0;text-align:left;min-width:0}
      .card img,.placeholder {width:100%;aspect-ratio:2/3;object-fit:contain;background:#202025;border-radius:8px;display:block}
      .card strong {display:block;margin-top:8px;font-size:15px}
      .poster-card {min-width:0;display:flex;flex-direction:column;align-items:stretch}
      .ratings {display:flex;align-items:center;flex-wrap:wrap;gap:4px 6px;margin-top:5px;color:#aaa;font-size:12px;font-variant-numeric:tabular-nums}
      .imdb-rating {color:#f5c518;white-space:nowrap}
      .rt-rating {display:inline-flex;align-items:center;gap:4px;color:#eee;background:#242124;border:1px solid #494149;border-radius:4px;font-size:12px;line-height:1.5;padding:1px 5px;text-decoration:none;white-space:nowrap;font-variant-numeric:tabular-nums}
      .rt-rating[data-sentiment="fresh"] {background:#30201e;border-color:#684039}
      .rt-rating[data-sentiment="rotten"] {background:#192a20;border-color:#34583f}
      .rt-rating:hover {color:#fff;filter:brightness(1.3)}
      .rt-icon {width:14px;height:14px;flex:none;display:block}
      #viewer-ratings {display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin:0 0 8px}
      #viewer-ratings #meta {margin:0}
      .placeholder {display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;text-align:center;padding:15px;color:#aaa;overflow-wrap:anywhere}
      .placeholder .placeholder-title {margin:0;color:#f5f5f5;font-size:clamp(20px,2vw,30px);line-height:1.2}
      .placeholder .placeholder-year {font-size:24px;color:#f5c518}
      .placeholder .placeholder-note {font-size:14px;color:#aaa}
      #viewer {height:100%;display:flex;flex-direction:column}
      #stage {flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:16px;padding:8px 20px;touch-action:pan-y;user-select:none}
      #stage img {max-width:calc(100% - 144px);max-height:100%;object-fit:contain;border-radius:6px;-webkit-user-drag:none}
      #stage button {flex-shrink:0;font-size:32px;width:56px;padding:6px}
      #missing {max-width:400px;max-height:100%;flex:1;width:auto}
      #details {text-align:center;padding:10px 20px 18px}
      #title {font-size:22px;margin:0 0 5px}
      #meta {color:#c3c3cb;margin:0 0 4px}
      #role {color:#aaa;margin:0 0 12px;font-size:14px}
      #open {display:inline-block;color:#111;background:#f5c518;text-decoration:none;border-radius:8px;padding:10px 18px;font-weight:650;min-height:44px}
      #counter {font-size:14px;color:#aaa;margin-left:12px}
      [hidden] {display:none!important}
      @media(max-width:600px) {
        dialog {width:100vw;height:100dvh;max-width:100vw;border:0;border-radius:0}
        header {padding:10px 12px} h2 {font-size:17px}
        .tools {padding:10px 12px;gap:8px}
        #grid {grid-template-columns:repeat(2,minmax(0,1fr));padding:8px 12px;gap:16px}
        #stage {padding:5px;gap:5px}
        #stage button {width:42px;font-size:26px;padding:0}
        #stage img {max-width:calc(100% - 94px)}
        #title {font-size:18px}
        #launch {bottom:16px;right:12px}
      }
    </style>
    <button id="launch" type="button">Browse posters</button>
    <dialog aria-labelledby="heading">
      <div class="shell">
        <header><h2 id="heading"><span id="actor"></span> · Posters</h2><button id="view" type="button">Poster grid</button><button id="close" type="button" aria-label="Close poster browser">×</button></header>
        <div class="tools">
          <input id="search" type="search" placeholder="Find a film…" aria-label="Find a film">
          <select id="type" aria-label="Title types"><option value="movie">Movies</option><option value="all">All acting credits</option></select>
          <select id="sort" aria-label="Sort posters"><option value="rating">IMDb rating ↓</option><option value="rt">Rotten Tomatoes rating ↓</option><option value="new">Newest first</option><option value="old">Oldest first</option><option value="title">Title A–Z</option></select>
        </div>
        <div id="message" role="status" aria-live="polite"></div>
        <div id="content">
          <div id="grid" hidden></div>
          <div id="viewer">
            <div id="stage"><button id="prev" type="button" aria-label="Previous poster">‹</button><img id="poster" alt="" draggable="false"><div id="missing" class="placeholder" hidden></div><button id="next" type="button" aria-label="Next poster">›</button></div>
            <div id="details"><h3 id="title"></h3><div id="viewer-ratings"><p id="meta"></p><a id="rt" class="rt-rating" target="_blank" rel="noopener noreferrer"></a></div><p id="role"></p><a id="open" target="_blank" rel="noopener noreferrer">Open movie ↗</a><span id="counter"></span></div>
          </div>
        </div>
      </div>
    </dialog>`;
  document.body.append(host);
  const $ = id => root.getElementById(id);
  const dialog = root.querySelector('dialog');
  let items = [], filtered = [], index = 0, gridMode = true, actorGroups = [];
  let returnFocus = null, savedOverflow = '', loading = false, refreshTimer, loadNotice = '';
  const rtResults = new Map(), rtQueue = new Map(), rtPending = new Set();
  let rtActive = 0, rtResortTimer;
  const rtSearch = t => 'https://www.rottentomatoes.com/search?search=' + encodeURIComponent(t.title);
  const normalizeTitle = value => value.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/&/g,'and').replace(/[^\p{L}\p{N}]/gu,'');
  const rtObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      rtObserver.unobserve(entry.target);
      const t = items.find(item => item.id === entry.target.dataset.rtObserveId);
      if (t) { rtQueue.set(t.id,t); loadRatings(); }
    }
  }, {root:$('content'),rootMargin:'150px'});
  function ratingResult(t) {
    const current = rtResults.get(t.id);
    if (current && (current.key !== t.title + ':' + t.year + ':' + t.type || current.expires <= Date.now())) rtResults.delete(t.id);
    if (!rtResults.has(t.id)) {
      try {
        const cached = GM_getValue('rt:' + t.id, null);
        if (cached && cached.key === t.title + ':' + t.year + ':' + t.type && cached.expires > Date.now() &&
            (cached.score === null || (Number.isInteger(cached.score) && cached.score >= 0 && cached.score <= 100)) &&
            (cached.url === rtSearch(t) || /^https:\/\/www\.rottentomatoes\.com\/(m|tv)\/[a-z0-9_]+\/?$/.test(cached.url))) rtResults.set(t.id,cached);
      } catch { /* Storage may be unavailable. Keep browsing without it. */ }
    }
    return rtResults.get(t.id);
  }
  function updateRating(link,t) {
    const result = ratingResult(t);
    link.hidden = result?.score == null;
    link.href = result?.url || rtSearch(t);
    link.dataset.state = result ? (result.score === null ? 'empty' : 'rated') : 'loading';
    const sentiment = result?.score == null ? '' : result.score >= 60 ? 'fresh' : 'rotten';
    link.dataset.sentiment = sentiment;
    link.replaceChildren();
    if (sentiment) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.classList.add('rt-icon');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
      icon.innerHTML = sentiment === 'fresh'
        ? '<path fill="#fa3210" d="M12 6C3 2-1 11 3 18c3 6 15 6 18 0 4-7 0-16-9-12Z"/><path fill="#009b36" d="m12 7-8 1 4-4-2-2 5 1 2-3 2 1-1 3 5-1-2 4 4 2-7-1-2 4Z"/>'
        : '<path fill="#0ac855" d="M10 8C5 4 9-1 13 1s-1 7 2 8 4-7 7-4-5 6-4 8 7 1 5 5-7-3-9-1 1 7-3 7-1-7-4-7-5 5-7 1 6-4 6-7-7-2-6-5 7-1 10 2Z"/>';
      const score = document.createElement('span');score.textContent=result.score+'% ↗';
      link.append(icon,score);
    }
    const label = sentiment ? 'Rotten Tomatoes: ' + result.score + '% · ' + (sentiment === 'fresh' ? 'Fresh' : 'Rotten') + ' · Tomatometer critic score for ' + t.title : 'Rotten Tomatoes: ' + (result ? 'score unavailable' : 'loading score') + ' for ' + t.title;
    link.title = label + (sentiment ? (sentiment === 'fresh' ? ' (at least 60% positive reviews)' : ' (less than 60% positive reviews)') : '');
    link.setAttribute('aria-label',label + ' (opens in a new tab)');
  }
  function bindRating(link,t) {
    link.dataset.rtId = t.id;
    updateRating(link,t);
    if (!ratingResult(t)) {
      link.parentElement.dataset.rtObserveId = t.id;
      rtObserver.observe(link.parentElement);
    }
  }
  function findRating(html,t) {
    const doc = new DOMParser().parseFromString(html,'text/html');
    const movie = ['movie','tvMovie','short','video'].includes(t.type);
    const series = ['tvSeries','tvMiniSeries'].includes(t.type);
    const matches = [...doc.querySelectorAll('search-page-media-row')].filter(row => {
      const link = row.querySelector('a[slot="title"]');
      const url = link?.getAttribute('href') || '';
      return (movie ? /^https:\/\/www\.rottentomatoes\.com\/m\/[a-z0-9_]+\/?$/.test(url) : series && /^https:\/\/www\.rottentomatoes\.com\/tv\/[a-z0-9_]+\/?$/.test(url)) &&
        normalizeTitle(link.textContent.trim()) === normalizeTitle(t.title) && !!t.year &&
        String(t.year) === row.getAttribute(movie ? 'release-year' : 'start-year');
    });
    if (matches.length !== 1) return {score:null,url:rtSearch(t)};
    const row = matches[0], raw = row.getAttribute('tomatometer-score');
    const score = raw !== null && /^\d{1,3}$/.test(raw) && Number(raw) <= 100 ? Number(raw) : null;
    return {score,url:row.querySelector('a[slot="title"]').getAttribute('href')};
  }
  async function loadRatings() {
    while (dialog.open && rtActive < 2 && rtQueue.size) {
      const [id,t] = rtQueue.entries().next().value;
      rtQueue.delete(id);
      if (ratingResult(t) || rtPending.has(id) || ($('sort').value !== 'rt' && ![...root.querySelectorAll('[data-rt-id]')].some(link => link.dataset.rtId === id && link.parentElement.getClientRects().length))) continue;
      rtPending.add(id);
      rtActive++;
      (async () => {
        let result;
        try {
          const html = await new Promise((resolve,reject) => {
            GM_xmlhttpRequest({method:'GET',url:rtSearch(t),anonymous:true,timeout:15000,
              onload:response => response.status === 200 ? resolve(response.responseText) : reject(new Error('Rating unavailable')),
              onerror:reject,ontimeout:reject,onabort:reject});
          });
          result = {...findRating(html,t),key:t.title + ':' + t.year + ':' + t.type,expires:Date.now()+86400000};
          try { GM_setValue('rt:' + id,result); } catch { /* Cache is optional. */ }
        } catch { result = {score:null,url:rtSearch(t),key:t.title + ':' + t.year + ':' + t.type,expires:Date.now()+60000}; }
        rtResults.set(id,result);
        for (const link of root.querySelectorAll('[data-rt-id]')) if (link.dataset.rtId === id) updateRating(link,t);
        if (dialog.open && $('sort').value === 'rt') {
          clearTimeout(rtResortTimer);
          rtResortTimer = setTimeout(() => {
            if (dialog.open && $('sort').value === 'rt') applyFilters(filtered[index]?.id);
          },150);
        }
      })().finally(() => { rtPending.delete(id); rtActive--; loadRatings(); });
    }
  }
  const imageUrl = (url, width=700) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' || !/(^|\.)media-amazon\.com$/.test(u.hostname)) return '';
      return u.href.replace(/\._V1_[^/]*\.(jpg|jpeg|png)(?:\?.*)?$/i, '._V1_QL85_UX' + width + '_.$1');
    } catch { return ''; }
  };
  function collect() {
    const found = new Map();
    actorGroups = [];
    try {
      const data = JSON.parse(document.getElementById('__NEXT_DATA__')?.textContent || '{}').props?.pageProps;
      $('actor').textContent = data?.aboveTheFold?.nameText?.text || document.querySelector('h1')?.textContent || 'Filmography';
      for (const state of ['released','unreleased']) {
        for (const edge of data?.mainColumnData?.[state]?.edges || []) {
          const group = edge.node;
          if (!/^(actor|actress)$/i.test(group.grouping?.text || '')) continue;
          actorGroups.push(group.grouping.groupingId);
          for (const credit of group.credits?.edges || []) {
            const node = credit.node, t = node.title;
            if (!t?.id) continue;
            found.set(t.id, {
              id:t.id, title:t.titleText?.text || t.originalTitleText?.text || t.id,
              year:t.releaseYear?.year || '', type:t.titleType?.id || 'movie',
              typeText:t.titleType?.text || '', rating:t.ratingsSummary?.aggregateRating || '',
              role:(node.creditedRoles?.edges || []).map(r=>r.node.text).filter(Boolean).join(', '),
              image:imageUrl(t.primaryImage?.url), upcoming:state==='unreleased'
            });
          }
        }
      }
    } catch { $('actor').textContent = document.querySelector('h1')?.textContent || 'Filmography'; }
    for (const row of document.querySelectorAll('li[data-testid^="cred_"],li[data-testid^="unrel_cred_"]')) {
      const test = row.getAttribute('data-testid') || '';
      if (actorGroups.length && !actorGroups.some(g=>test.includes(g))) continue;
      const a = row.querySelector('a.ipc-metadata-list-summary-item__t') || row.querySelector('a[href*="/title/tt"]');
      const id = a?.getAttribute('href')?.match(/\/title\/(tt\d+)/)?.[1];
      if (!id) continue;
      const old = found.get(id);
      const badge = a.nextElementSibling?.textContent || '';
      const type = /TV (Series|Mini Series)/i.test(badge) ? 'tvSeries' : /TV Movie/i.test(badge) ? 'tvMovie' : /TV Special/i.test(badge) ? 'tvSpecial' : /Music Video/i.test(badge) ? 'musicVideo' : /Video Game/i.test(badge) ? 'videoGame' : /Short/i.test(badge) ? 'short' : /Video/i.test(badge) ? 'video' : 'movie';
      const img = row.querySelector('img');
      found.set(id, {
        ...old, id, title:a.textContent.trim() || a.getAttribute('aria-label') || old?.title || id,
        year:old?.year || row.querySelector('.ipc-metadata-list-summary-item__li')?.textContent.match(/(?:18|19|20|21)\d{2}/)?.[0] || '',
        type:old?.type || type, typeText:old?.typeText || (type==='movie'?'Movie':badge.replace(/[\d.★]/g,'').trim()),
        rating:old?.rating || row.querySelector('.ipc-rating-star--rating')?.textContent || '',
        role:old?.role || row.querySelector('[data-testid="credit-roles-list"]')?.textContent || '',
        image:old?.image || imageUrl(img?.getAttribute('src')),
        upcoming:old?.upcoming ?? test.startsWith('unrel_')
      });
    }
    items = [...found.values()];
  }
  function applyFilters(keepId) {
    const query = $('search').value.trim().toLocaleLowerCase();
    filtered = items.filter(t => ($('type').value==='all' || ['movie','tvMovie'].includes(t.type)) && t.title.toLocaleLowerCase().includes(query));
    const sort = $('sort').value;
    const byImdb = (a,b) => (Number(b.rating)||0)-(Number(a.rating)||0) || (Number(b.year)||0)-(Number(a.year)||0) || a.title.localeCompare(b.title);
    filtered.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='rt'?((ratingResult(b)?.score ?? -1)-(ratingResult(a)?.score ?? -1) || byImdb(a,b)):sort==='rating'?byImdb(a,b):sort==='old'?(Number(a.year)||9999)-(Number(b.year)||9999):(Number(b.year)||0)-(Number(a.year)||0));
    index = Math.max(0, filtered.findIndex(t=>t.id===keepId));
    render();
  }
  function fillPlaceholder(element, title) {
    const name = document.createElement('strong'); name.className='placeholder-title'; name.textContent=title.title;
    const year = document.createElement('span'); year.className='placeholder-year'; year.textContent=title.year;
    const note = document.createElement('span'); note.className='placeholder-note'; note.textContent='No poster available';
    element.replaceChildren(name, ...(title.year ? [year] : []), note);
    return element;
  }
  function render() {
    const focused = root.activeElement;
    const focusedId = focused?.closest('.poster-card')?.dataset.titleId;
    const focusedRating = focused?.classList.contains('rt-rating');
    rtObserver.disconnect();
    rtQueue.clear();
    $('grid').hidden = !gridMode;
    $('viewer').hidden = gridMode || !filtered.length;
    $('view').textContent = gridMode ? 'Single poster' : 'Poster grid';
    $('view').setAttribute('aria-pressed',String(gridMode));
    $('message').textContent = filtered.length + ' titles · ' + items.length + ' acting credits loaded' + (loading ? ' · Loading more credits automatically…' : loadNotice) + (filtered.length ? ' · ' : ' · No matching titles.');
    if ($('sort').value === 'rt') {
      const checked = filtered.filter(t=>ratingResult(t)).length;
      if (checked < filtered.length) $('message').append('Loading RT ratings ' + checked + '/' + filtered.length + ' · ');
    }
    if (filtered.length) {
      for (const arrow of (gridMode ? ['↑','↓'] : ['←','→'])) {
        const key = document.createElement('kbd'); key.textContent=arrow; $('message').append(key, ' ');
      }
      $('message').append(gridMode ? 'to scroll · Select a poster to open it.' : 'or swipe to browse.');
    }
    if (gridMode) {
      const fragment = document.createDocumentFragment();
      filtered.forEach((t,i)=>{
        const card = document.createElement('div'); card.className='poster-card';card.dataset.titleId=t.id;
        const b = document.createElement('button'); b.type='button'; b.className='card';
        b.setAttribute('aria-label','View poster: '+t.title);
        if(t.image) {
          const img = document.createElement('img'); img.src=imageUrl(t.image,300); img.alt=t.title; img.loading='lazy';
          img.addEventListener('error',()=>{img.hidden=true;const p=document.createElement('span');p.className='placeholder';b.prepend(fillPlaceholder(p,t));},{once:true}); b.append(img);
        } else { const p=document.createElement('span');p.className='placeholder';b.append(fillPlaceholder(p,t)); }
        const title=document.createElement('strong');title.textContent=t.title;b.append(title);
        const meta=document.createElement('div');meta.className='ratings';
        if(t.year) {const year=document.createElement('span');year.textContent=t.year;meta.append(year);}
        if(t.rating) {const imdb=document.createElement('span');imdb.className='imdb-rating';imdb.textContent='★ '+t.rating;imdb.title='IMDb rating: '+t.rating+' / 10';meta.append(imdb);}
        b.addEventListener('click',()=>{index=i;gridMode=false;render();$('content').scrollTop=0;($('prev').disabled?$('close'):$('prev')).focus();});
        const rt = document.createElement('a');rt.className='rt-rating';rt.target='_blank';rt.rel='noopener noreferrer';
        meta.append(rt);card.append(b,meta);fragment.append(card);bindRating(rt,t);
      });
      $('grid').replaceChildren(fragment);
      if (focusedId) {
        const card = [...$('grid').children].find(card=>card.dataset.titleId===focusedId);
        const rating = card?.querySelector('.rt-rating');
        (focusedRating && !rating?.hidden ? rating : card?.querySelector('.card'))?.focus({preventScroll:true});
      }
    } else if(filtered.length) {
      const t=filtered[index];
      fillPlaceholder($('missing'),t);
      $('title').textContent=t.title;
      $('meta').textContent=[t.year,t.typeText,t.rating?'★ '+t.rating:'',t.upcoming?'Upcoming':''].filter(Boolean).join(' · ');
      $('role').textContent=t.role;
      bindRating($('rt'),t);
      $('open').href='https://www.imdb.com/title/'+t.id+'/';
      $('counter').textContent=(index+1)+' / '+filtered.length;
      $('poster').hidden=!t.image;$('missing').hidden=!!t.image;
      if(t.image) { $('poster').src=t.image; $('poster').alt=t.title+' poster'; }
      $('prev').disabled=index===0;$('next').disabled=index===filtered.length-1;
      const next=filtered[index+1];if(next?.image){const preload=new Image();preload.src=next.image;}
    }
    if ($('sort').value === 'rt') {
      for (const t of filtered) if (!ratingResult(t)) rtQueue.set(t.id,t);
      loadRatings();
    }
  }
  function step(delta) {if(gridMode||!filtered.length)return; index=Math.min(filtered.length-1,Math.max(0,index+delta));render();}
  function open(id) {
    returnFocus=document.activeElement;
    gridMode=!id;
    collect();$('search').value='';applyFilters(id);
    if(id&&!filtered.some(t=>t.id===id)){$('type').value='all';applyFilters(id);}
    if(!dialog.open){savedOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();}
    loadRatings();
    $('close').focus();
    loadNotice='';loadCredits();
  }
  function getLoadButton() {
    for(const row of document.querySelectorAll('li[data-testid^="cred_"]')) {
      if(actorGroups.length&&!actorGroups.some(g=>row.getAttribute('data-testid').includes(g)))continue;
      const section=row.closest('.ipc-accordion__item__content_inner');
      const button=[...(section?.querySelectorAll('button')||[])].find(b=>/^(See all|Load more)$/i.test(b.textContent.trim()));
      if(button)return button;
    }
    return null;
  }
  $('launch').addEventListener('click',()=>open());
  $('close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{rtObserver.disconnect();rtQueue.clear();clearTimeout(rtResortTimer);document.documentElement.style.overflow=savedOverflow;returnFocus?.focus?.();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  $('view').addEventListener('click',()=>{gridMode=!gridMode;render();});
  $('search').addEventListener('input',()=>applyFilters());
  for(const id of ['type','sort'])$(id).addEventListener('change',()=>applyFilters(filtered[index]?.id));
  $('prev').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));
  $('poster').addEventListener('error',()=>{$('poster').hidden=true;$('missing').hidden=false;});
  dialog.addEventListener('keydown',e=>{
    if(e.target.matches('input,select'))return;
    if(gridMode) {
      if(e.key==='ArrowUp'||e.key==='ArrowDown') {e.preventDefault();$('content').scrollBy({top:e.key==='ArrowUp'?-160:160});}
      return;
    }
    if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}
    if(e.key==='ArrowRight'){e.preventDefault();step(1);}
    if(e.key==='Home'){e.preventDefault();index=0;render();}
    if(e.key==='End'){e.preventDefault();index=Math.max(0,filtered.length-1);render();}
  });
  let start;
  $('stage').addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};$('stage').setPointerCapture(e.pointerId);});
  $('stage').addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)step(dx<0?1:-1);});
  $('stage').addEventListener('pointercancel',()=>{start=null;});
  async function loadCredits() {
    if(loading||!getLoadButton())return;
    loading=true;render();
    try {
      while(dialog.open) {
        const button=getLoadButton();if(!button)break;
        const before=items.length;button.click();
        for(let n=0;n<30&&dialog.open;n++) {
          await new Promise(r=>setTimeout(r,300));collect();
          if(items.length>before)break;
        }
        if(!dialog.open)break;
        const keep=filtered[index]?.id;applyFilters(keep);
        if(items.length<=before) {loadNotice=' · IMDb did not return more credits. Reopen the browser to retry.';break;}
      }
    } catch {loadNotice=' · Could not load more credits. Reopen the browser to retry.';}
    finally {loading=false;const keep=filtered[index]?.id;collect();applyFilters(keep);}
  }
  document.addEventListener('click',e=>{
    if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href*="/title/tt"]');
    const row=a?.closest('li[data-testid^="cred_"],li[data-testid^="unrel_cred_"]');
    if(!row||!a.closest('.ipc-poster'))return;
    e.preventDefault();e.stopImmediatePropagation();gridMode=false;open(a.getAttribute('href').match(/\/title\/(tt\d+)/)?.[1]);
  },true);
  new MutationObserver(()=>{
    if(!dialog.open)return;
    clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{const keep=filtered[index]?.id;collect();applyFilters(keep);},400);
  }).observe(document.body,{childList:true,subtree:true});
})();
