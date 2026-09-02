<script>
  'use strict';

  const THEMES = [
    'catppuccin', 'catppuccin-latte', 'ethereal', 'everforest', 'flexoki-light',
    'gruvbox', 'hackerman', 'kanagawa', 'last-horizon', 'lumon', 'lupine',
    'matte-black', 'miasma', 'nord', 'osaka-jade', 'retro-82', 'ristretto',
    'rose-pine', 'solitude', 'tokyo-night',
  ];
  const STORE_KEY = 'omarchy-redesign-theme-v1';
  const DEFAULT_THEME = 'flexoki-light';
  const root = document.documentElement;

  function applyTheme(name) {
    if (name === DEFAULT_THEME) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);
    document.getElementById('theme-name').textContent = name;
    const tc = document.getElementById('theme-color');
    if (tc) tc.setAttribute('content', getComputedStyle(root).getPropertyValue('--desktop').trim());
    try { localStorage.setItem(STORE_KEY, name); } catch (e) {}
  }
  function cycleTheme() {
    const current = root.getAttribute('data-theme') || DEFAULT_THEME;
    applyTheme(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);
  }
  document.getElementById('theme-btn').addEventListener('click', cycleTheme);
  addEventListener('keydown', e => {
    if (document.querySelector('dialog[open]')) return;
    if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === 't') cycleTheme();
  });

  /* image lightbox for long-form content and galleries */
  (() => {
    const imgs = document.querySelectorAll('.prose img, .shots img');
    if (!imgs.length) return;
    const box = document.createElement('dialog');
    box.className = 'imgbox';
    box.tabIndex = -1;
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<div class="imgbox__inner"><div class="imgbox__bar"><p class="win__title"></p><button class="imgbox__close" type="button">close [esc]</button></div><img alt=""></div>';
    document.body.appendChild(box);
    const big = box.querySelector('img');
    const title = box.querySelector('.win__title');
    imgs.forEach(img => {
      img.classList.add('zoomable');
      img.addEventListener('click', () => {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        title.textContent = 'imv ' + decodeURIComponent(img.src.split('/').pop());
        box.showModal();
        box.focus();
      });
    });
    box.querySelector('.imgbox__close').addEventListener('click', () => box.close());
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
  })();

  /* people marquees: duplicate the track content client-side so the markup
     lists every person once; reduced motion falls back to a wrapped row */
  (() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.people:not(.people--static)').forEach(p => {
      if (reduced) { p.classList.add('people--static'); return; }
      const track = p.querySelector('.people__track');
      track.innerHTML += track.innerHTML;
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      p.appendChild(clone);
    });
  })();

  /* real bar height feeds the sticky offsets */
  const bar = document.querySelector('.bar');
  new ResizeObserver(() => {
    root.style.setProperty('--bar-h', bar.offsetHeight + 'px');
  }).observe(bar);

  /* chapter toc collapses into a dropdown on small screens; the whole card
     is the tap target, links and the search button stay untouched */
  document.querySelectorAll('.docs__toc').forEach(toc => {
    toc.addEventListener('click', e => {
      if (!matchMedia('(max-width: 900px)').matches) return;
      if (e.target.closest('a, button')) return;
      toc.classList.toggle('open');
    });
  });

  const clock = document.getElementById('clock');
  function tick() {
    const d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tick(); setInterval(tick, 15000);

  /* ?theme=<name> wins over the stored choice and becomes the stored one */
  try {
    /* light/dark are shorthands for the two headline themes */
    const ALIAS = { light: 'flexoki-light', dark: 'tokyo-night' };
    const param = new URLSearchParams(location.search).get('theme');
    const wanted = ALIAS[param] || param;
    const saved = localStorage.getItem(STORE_KEY);
    if (THEMES.includes(wanted)) applyTheme(wanted);
    /* nothing chosen yet: follow the OS, dark systems land on tokyo-night */
    else if (saved && THEMES.includes(saved)) applyTheme(saved);
    else applyTheme(matchMedia('(prefers-color-scheme: dark)').matches ? ALIAS.dark : DEFAULT_THEME);
  } catch (e) { applyTheme(DEFAULT_THEME); }
</script>
</body>
</html>
