<script>
(() => {
  'use strict';

  const css = document.createElement('style');
  css.textContent = `
  .cmdk {
    position: fixed; left: 50%; top: 9vh; transform: translateX(-50%);
    margin: 0; padding: 0;
    width: min(640px, calc(100vw - 24px));
    background: var(--win); color: var(--fg);
    border: 1.5px solid var(--accent); border-radius: 6px;
  }
  .cmdk:focus { outline: none; }
  .cmdk::backdrop { background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px); }
  .cmdk__field { display: flex; align-items: center; gap: 1ch; padding: 12px 16px 10px; }
  .cmdk__field > span { color: var(--ok); font-weight: 700; }
  .cmdk__field input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: var(--fg); font: inherit; }
  .cmdk__field input::placeholder { color: var(--muted); }
  .cmdk__field kbd { font: inherit; font-size: 0.6875rem; color: var(--muted); border: 1px solid var(--border); border-radius: 3px; padding: 0 5px; }
  .cmdk__pills { display: flex; gap: 6px; padding: 0 16px 12px; border-bottom: 1px solid var(--border); }
  .cmdk__pills button {
    background: none; border: 1px solid var(--border); border-radius: 999px;
    color: var(--muted); font: inherit; font-size: 0.6875rem;
    padding: 2px 10px; cursor: pointer;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .cmdk__pills button:hover { border-color: var(--accent); color: var(--fg); }
  .cmdk__pills button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); background: color-mix(in oklab, var(--accent) 12%, transparent); }
  .cmdk__results {
    height: min(48vh, 400px); overflow-y: auto;
    padding: 8px; display: grid; grid-template-columns: minmax(0, 1fr);
    gap: 2px; align-content: start;
    --fade-top: 0px; --fade-bottom: 0px;
    -webkit-mask-image: linear-gradient(180deg, transparent, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent);
    mask-image: linear-gradient(180deg, transparent, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent);
  }
  .cmdk__results a { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 7px 10px; border-radius: 4px; text-decoration: none; color: var(--fg); font-size: 0.8125rem; }
  .cmdk__results a[aria-selected="true"] { background: var(--surface); }
  .cmdk__results .ico { display: flex; flex-shrink: 0; }
  .cmdk__results .ico svg { width: 14px; height: 14px; fill: var(--muted); }
  .cmdk__results a[aria-selected="true"] .ico svg { fill: var(--accent); }
  .cmdk__results .t { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .cmdk__results .c { color: var(--muted); font-size: 0.6875rem; white-space: nowrap; }
  .cmdk__empty { margin: 0; padding: 10px; color: var(--muted); font-size: 0.8125rem; }`;
  document.head.appendChild(css);

  const box = document.createElement('dialog');
  box.className = 'cmdk';
  box.tabIndex = -1;
  box.setAttribute('aria-label', 'Search the site');
  box.innerHTML = `
    <div class="cmdk__field"><span aria-hidden="true">❯</span>
      <input type="text" placeholder="search the site" autocomplete="off" autocapitalize="off" spellcheck="false">
      <kbd>esc</kbd>
    </div>
    <div class="cmdk__pills" role="group" aria-label="Filter results">
      <button type="button" data-f="all" aria-pressed="true">all</button>
      <button type="button" data-f="pages" aria-pressed="false">pages</button>
      <button type="button" data-f="manual" aria-pressed="false">manual</button>
      <button type="button" data-f="news" aria-pressed="false">news</button>
    </div>
    <div class="cmdk__results" role="listbox"></div>`;
  document.body.appendChild(box);

  const input = box.querySelector('input');
  const list = box.querySelector('.cmdk__results');
  const pills = [...box.querySelectorAll('.cmdk__pills button')];
  let index = null, results = [], sel = 0, filter = 'all';

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
  function setPills(f) {
    pills.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
  }

  function updateFades() {
    const canUp = list.scrollTop > 4;
    const canDown = list.scrollHeight - list.scrollTop - list.clientHeight > 4;
    list.style.setProperty('--fade-top', canUp ? '28px' : '0px');
    list.style.setProperty('--fade-bottom', canDown ? '28px' : '0px');
  }
  list.addEventListener('scroll', updateFades, { passive: true });

  function updateSel(scroll) {
    [...list.querySelectorAll('a')].forEach((a, i) => a.setAttribute('aria-selected', String(i === sel)));
    if (scroll) list.querySelector('a[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function renderList() {
    list.innerHTML = results.map((r, i) =>
      `<a href="${r.p}" data-i="${i}"${i === sel ? ' aria-selected="true"' : ''}><span class="ico" aria-hidden="true">${icon(r.c)}</span><span class="t">${r.t}</span><span class="c">${r.c}</span></a>`
    ).join('') || '<p class="cmdk__empty">no matches — try a pill or a prefix like manual:</p>';
    list.scrollTop = 0;
    updateFades();
  }
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
    setPills(f);
    const terms = rest.split(/\s+/).filter(Boolean);
    const pool = index.filter(e => inFilter(e, f));
    results = terms.length
      ? pool.filter(e => terms.every(t => e.k.includes(t))).slice(0, 24)
      : pool.slice(0, f === 'all' ? 12 : 24);
    sel = 0;
    renderList();
  }
  function openBox() {
    filter = 'all';
    box.showModal();
    input.value = '';
    load().then(() => search(''));
    input.focus();
  }

  pills.forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f;
    input.value = input.value.replace(/^\s*(manual|news|pages?|all):\s*/i, '');
    search(input.value);
    input.focus();
  }));
  input.addEventListener('input', () => search(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, results.length - 1); updateSel(true); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); updateSel(true); e.preventDefault(); }
    else if (e.key === 'Enter' && results[sel]) location.href = results[sel].p;
  });
  box.addEventListener('click', e => { if (e.target === box) box.close(); });
  addEventListener('keydown', e => {
    const combo = (e.metaKey || e.ctrlKey) && e.key === 'k';
    const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector('dialog[open]');
    if (combo || slash) { e.preventDefault(); if (!box.open) openBox(); }
  });
  document.querySelectorAll('[data-search-open]').forEach(b => b.addEventListener('click', openBox));

  /* show the platform's actual modifier */
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
  document.querySelectorAll('[data-kbd-search]').forEach(k => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
})();
</script>
