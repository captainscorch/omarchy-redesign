<script>
(() => {
  'use strict';

  const css = document.createElement('style');
  css.textContent = `
  /* centred while idle, like the real menu; no open animation there either */
  .cmdk {
    position: fixed; inset: 0; margin: auto; padding: 18px;
    width: min(320px, 92vw); max-height: 84vh;
    background: var(--win); color: var(--fg);
    border: 2px solid var(--accent); border-radius: 0;
    animation: none;
  }
  /* the first keystroke freezes the top edge so the list grows downward */
  .cmdk--pinned { bottom: auto; margin-top: 0; margin-bottom: auto; }
  /* author display beats the UA's dialog:not([open]) rule — only open */
  .cmdk[open] { display: flex; flex-direction: column; }
  .cmdk:focus { outline: none; }
  .cmdk::backdrop { background: color-mix(in srgb, var(--desktop) 50%, transparent); }
  /* the header does double duty: prompt when idle, the typed filter after */
  .cmdk__field { display: flex; align-items: center; height: 34px; flex-shrink: 0; }
  .cmdk__field input {
    width: 100%; min-width: 0;
    background: none; border: none; outline: none; padding: 0;
    color: var(--fg); font: inherit; font-size: 16px;
  }
  .cmdk__field input::placeholder { color: var(--fg); opacity: 0.58; }
  .cmdk__results { overflow-y: auto; display: grid; gap: 3px; align-content: start; }
  .cmdk__results a {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    grid-template-areas: "ico t chev" "ico c chev";
    align-content: center;
    height: 50px; padding: 0 8px;
    border: 0; border-radius: 0;
    text-decoration: none; color: var(--fg);
  }
  /* a submenu's children drop the glyph column, like the real menu */
  .cmdk--sub .cmdk__results a {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "t chev" "c chev";
  }
  .cmdk__results a:not([href]) { cursor: pointer; }
  .cmdk__results a[aria-selected="true"] { background: color-mix(in srgb, var(--fg) 8%, transparent); }
  .cmdk__results a[aria-selected="true"] .ico, .cmdk__results a[aria-selected="true"] .t { color: var(--accent); }
  .cmdk__results .ico { grid-area: ico; display: flex; align-items: center; font-size: 18px; line-height: 1; }
  .cmdk__results .ico--glyph { font-family: 'Omarchy Menu Symbols', 'JetBrains Mono', monospace; }
  .cmdk__results .ico svg { width: 18px; height: 18px; fill: currentColor; }
  .cmdk__results .t { grid-area: t; font-size: 16px; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .cmdk__results .c { grid-area: c; display: none; font-size: 11px; opacity: 0.52; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .cmdk__results .chev { grid-area: chev; font-size: 16px; font-weight: 400; opacity: 0.36; }
  /* a filtered list trades height for the breadcrumb under each label */
  .cmdk--search .cmdk__results a { height: 58px; }
  .cmdk--search .cmdk__results .c { display: block; }
  .cmdk__empty { margin: auto; padding: 24px 8px; text-align: center; }
  .cmdk__empty b { display: block; margin-bottom: 8px; font-family: 'Omarchy Menu Symbols', 'JetBrains Mono', monospace; font-size: 28px; font-weight: 400; line-height: 1; color: var(--accent); opacity: 0.8; }
  .cmdk__empty span { font-size: 18px; opacity: 0.7; }`;
  document.head.appendChild(css);

  const box = document.createElement('dialog');
  box.className = 'cmdk';
  box.tabIndex = -1;
  box.setAttribute('aria-label', 'Omarchy menu');
  box.innerHTML = `
    <div class="cmdk__field">
      <input id="cmdk-filter" name="filter" type="text" placeholder="Omarchy…" aria-label="Omarchy menu" autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>
    <div class="cmdk__results" role="listbox"></div>`;
  document.body.appendChild(box);

  const input = box.querySelector('input');
  const list = box.querySelector('.cmdk__results');
  let index = null, results = [], sel = 0, filter = 'all', sub = null;

  const ICONS = {
    manual: '<svg viewBox="0 0 32 32"><path d="m0 4.49992c0-.3978.158025-.77931.439312-1.0606s.662798-.43931 1.060598-.43931h8.50549c2.4538 0 4.6337 1.17992 5.9996 3.00181.6982-.9334 1.6047-1.69085 2.6474-2.212 1.0426-.52115 2.1926-.7916 3.3582-.78981h8.4895c.3978 0 .7793.15802 1.0606.43931s.4393.6628.4393 1.0606v20.99868c0 .3978-.158.7793-.4393 1.0606s-.6628.4393-1.0606.4393h-9.0134c-.591 0-1.1761.1164-1.722.3425-.546.2261-1.042.5576-1.4598.9754l-1.244 1.2419c-.2812.2809-.6624.4387-1.0599.4387s-.7787-.1578-1.0599-.4387l-1.244-1.2419c-.4178-.4178-.9138-.7493-1.4598-.9754-.5459-.2261-1.131-.3425-1.722-.3425h-9.01539c-.3978 0-.779311-.158-1.060598-.4393s-.439312-.6628-.439312-1.0606zm14.5011 20.64668.008-10.1453-.004-4.5058c-.0011-1.19267-.4756-2.33616-1.3194-3.17916-.8437-.84299-1.9876-1.31652-3.1803-1.31652h-7.00559v17.99888h7.51349c1.4108-.0001 2.793.3978 3.9878 1.1479zm3.0078-14.6471-.008 14.6431c1.1942-.7477 2.5748-1.1442 3.9838-1.1439h7.5135v-17.99888h-6.9896c-1.1934 0-2.3379.47408-3.1818 1.31794-.8438.84386-1.3179 1.98838-1.3179 3.18174z"/></svg>',
    news: '<svg viewBox="0 0 32 32"><path d="M4 3h20v4h4v20H8v-4H4V3zm4 4v16h16V7H8zm3 3h10v3H11v-3zm0 6h10v2H11v-2zm0 4h7v2h-7v-2z"/></svg>',
    page: '<svg viewBox="0 0 1200 1200"><path fill-rule="evenodd" clip-rule="evenodd" d="m1200 1200h-480v-80h400v-1040h-479.996v160h-400v720h720v-720h-80v-80h159.996v880h-400v160h-640v-1200h1200zm-1120-80h480v-80h-400l.004-400h-80.004zm0-560h80.004v-400h400v-80h-480.004z"/></svg>',
  };
  function icon(c) {
    if (c.startsWith('manual')) return ICONS.manual;
    if (c.startsWith('news')) return ICONS.news;
    return ICONS.page;
  }

  /* pre-query the palette is the site's navigation, dressed as the real
     omarchy-menu: same rows, same nerd-font glyphs where the meaning carries
     over. x marks an external link, s a submenu parent */
  const MENU = [
    { t: 'Manual', p: '/manual/', g: '\u{F09D1}' },
    { t: 'Download ISO 4.0.2', p: 'https://iso.omarchy.org/omarchy-4.0.2.iso', g: '\u{F0249}', x: 1 },
    { t: 'Themes', p: '/#ws3', g: '\u{EBCF}' },
    { t: 'Plugins', p: 'https://omarchyplugins.com/', g: '\u{F003B}', x: 1 },
    { t: 'News', p: '/news/', g: '\u{F021}' },
    { t: 'Workstations', p: '/workstations/', g: '\u{F0322}' },
    { t: 'Teams', p: '/teams/', g: '\u{F0849}' },
    { t: 'Community', g: '\u{F028C}', s: 1, sub: [
      { t: 'Discord', p: 'https://discord.gg/tXFUdasqhY', x: 1 },
      { t: 'Meetups', p: '/meetups/' },
      { t: 'Merch', p: 'https://supply.37signals.com/collections/omarchy', x: 1 },
    ] },
    { t: 'Support', g: '\u{F02D1}', s: 1, sub: [
      { t: 'Patrons', p: '/patrons/' },
      { t: 'Sponsorships', p: '/sponsorships/' },
      { t: 'AIR', p: '/air/' },
    ] },
    { t: 'About', p: '/brand/', g: '\u{EA74}' },
  ];

  async function load() {
    if (index) return;
    try { index = await (await fetch('/assets/search-index.json')).json(); }
    catch (e) { index = []; }
  }

  function inFilter(e, f) {
    if (f === 'manual') return e.c.startsWith('manual');
    if (f === 'news') return e.c.startsWith('news');
    if (f === 'pages') return !e.c.startsWith('manual') && !e.c.startsWith('news');
    return true;
  }

  function updateSel(scroll) {
    [...list.querySelectorAll('a')].forEach((a, i) => a.setAttribute('aria-selected', String(i === sel)));
    if (scroll) list.querySelector('a[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function renderList(query) {
    const inSub = !!sub && !query;
    box.classList.toggle('cmdk--search', !!query);
    box.classList.toggle('cmdk--sub', inSub);
    list.innerHTML = results.map((r, i) => {
      const href = r.p ? ` href="${r.p}"` : '';
      const tab = r.x ? ' target="_blank" rel="noopener"' : '';
      const ico = inSub ? '' : `<span class="ico${r.g ? ' ico--glyph' : ''}" aria-hidden="true">${r.g || icon(r.c)}</span>`;
      return `<a${href}${tab} data-i="${i}"${i === sel ? ' aria-selected="true"' : ''}>${ico}<span class="t">${r.t}</span><span class="c">${r.c || ''}</span>${r.s ? '<span class="chev" aria-hidden="true">›</span>' : ''}</a>`;
    }).join('') || `<p class="cmdk__empty"><b aria-hidden="true">\u{F0209}</b><span>${query ? 'No matches for &quot;' + query + '&quot;' : 'Nothing here yet'}</span></p>`;
    list.scrollTop = 0;
  }
  /* the header doubles as the breadcrumb: "Community…" while drilled in */
  function enterSub(entry) {
    sub = entry;
    input.placeholder = entry.t + '…';
    pinTop();
    sel = 0;
    results = entry.sub;
    renderList('');
  }
  function leaveSub() {
    sub = null;
    input.placeholder = 'Omarchy…';
    search('');
  }
  function activate(r) {
    if (!r) return;
    if (r.sub) { enterSub(r); return; }
    if (r.x) window.open(r.p, '_blank', 'noopener');
    else location.href = r.p;
  }
  list.addEventListener('click', e => {
    const a = e.target.closest('a[data-i]');
    const r = a && results[Number(a.dataset.i)];
    if (r && r.sub) { e.preventDefault(); enterSub(r); }
  });
  /* hovering moves the selection, like any command menu should */
  list.addEventListener('pointermove', e => {
    const a = e.target.closest('a[data-i]');
    if (a && Number(a.dataset.i) !== sel) { sel = Number(a.dataset.i); updateSel(false); }
  });

  function search(q) {
    /* a "manual:", "news:" or "pages:" prefix in the query acts as the filter */
    let f = filter;
    let rest = q.toLowerCase();
    const m = rest.match(/^\s*(manual|news|pages?|all):\s*/);
    if (m) { f = m[1].startsWith('page') ? 'pages' : m[1]; rest = rest.slice(m[0].length); }
    const terms = rest.split(/\s+/).filter(Boolean);
    const pool = index.filter(e => inFilter(e, f));
    sel = 0;
    if (!terms.length && f === 'all') {
      results = sub ? sub.sub : MENU;
      renderList('');
      return;
    }
    results = terms.length
      ? pool.filter(e => terms.every(t => e.k.includes(t))).slice(0, 24)
      : pool.slice(0, 24);
    renderList(rest.trim() || f);
  }
  let pinned = false;
  function pinTop() {
    if (pinned) return;
    pinned = true;
    /* measured before the class lands, so the pin starts where it sits now */
    const top = box.getBoundingClientRect().top;
    box.style.top = top + 'px';
    box.style.maxHeight = 'calc(100vh - ' + Math.round(top + 24) + 'px)';
    box.classList.add('cmdk--pinned');
  }
  function unpin() {
    pinned = false;
    box.classList.remove('cmdk--pinned');
    box.style.top = box.style.maxHeight = '';
  }

  function openBox(f) {
    filter = ['manual', 'news', 'pages'].includes(f) ? f : 'all';
    unpin();
    box.showModal();
    input.value = '';
    sub = null;
    input.placeholder = 'Omarchy…';
    load().then(() => search(''));
    input.focus();
  }

  input.addEventListener('input', () => {
    if (input.value.trim()) pinTop();
    search(input.value);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, results.length - 1); updateSel(true); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); updateSel(true); e.preventDefault(); }
    else if (e.key === 'Enter') { activate(results[sel]); e.preventDefault(); }
    /* right drills in, backspace/left backs out — but only on an empty
       filter, where neither key has any text to edit */
    else if (e.key === 'ArrowRight' && !input.value) { activate(results[sel]); e.preventDefault(); }
    else if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && !input.value && sub) { leaveSub(); e.preventDefault(); }
  });
  /* esc clears the filter before it closes anything, like the real menu */
  box.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !input.value) return;
    e.preventDefault();
    input.value = '';
    search('');
  });
  box.addEventListener('click', e => { if (e.target === box) box.close(); });
  box.addEventListener('close', unpin);
  addEventListener('keydown', e => {
    const combo = (e.metaKey || e.ctrlKey) && e.key === 'k';
    const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector('dialog[open]');
    if (combo || slash) { e.preventDefault(); if (!box.open) openBox(); }
  });
  document.querySelectorAll('[data-search-open]').forEach(b =>
    b.addEventListener('click', () => openBox(b.getAttribute('data-search-open'))));

  /* show the platform's actual modifier */
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
  document.querySelectorAll('[data-kbd-search]').forEach(k => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
})();
</script>
