<script>
  'use strict';
  /* right-clicking the bar logo opens a small brand menu */
  (() => {
    const triggers = document.querySelectorAll('.bar__logo, [data-brand-menu]');
    if (!triggers.length) return;
    const style = document.createElement('style');
    style.textContent = [
      '.logomenu { position: fixed; z-index: 40; min-width: 220px; padding: 6px; background: var(--win); border: 1.5px solid var(--border); border-radius: 6px; box-shadow: 0 12px 32px rgb(0 0 0 / 0.35); display: flex; flex-direction: column; }',
      '.logomenu[hidden] { display: none; }',
      '.logomenu button, .logomenu a { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; font: inherit; font-size: 0.8125rem; text-align: left; background: none; border: 0; color: var(--fg); padding: 7px 10px; border-radius: 4px; cursor: pointer; text-decoration: none; transition: background 0.12s; }',
      '.logomenu button:hover, .logomenu a:hover { background: var(--surface); }',
      '.logomenu span { color: var(--muted); font-size: 0.6875rem; }',
      '.logomenu hr { border: 0; border-top: 1px solid var(--border); margin: 6px 0; }',
      '.logomenu i { color: var(--accent-2); font-style: normal; font-weight: 700; }',
    ].join('\n');
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.className = 'logomenu';
    menu.hidden = true;
    menu.setAttribute('aria-label', 'Brand menu');
    menu.innerHTML =
      '<button type="button" data-copy="/brand/omarchy-logo.svg">copy logo<span>svg</span></button>' +
      '<button type="button" data-copy="/brand/omarchy-wordmark.svg">copy wordmark<span>svg</span></button>' +
      '<hr><a href="/brand/">brand/ <i>→</i></a>';
    document.body.appendChild(menu);

    const close = () => { menu.hidden = true; };
    for (const el of triggers) el.addEventListener('contextmenu', e => {
      e.preventDefault();
      menu.hidden = false;
      const r = menu.getBoundingClientRect();
      menu.style.left = Math.min(e.clientX, innerWidth - r.width - 8) + 'px';
      menu.style.top = Math.min(e.clientY, innerHeight - r.height - 8) + 'px';
    });
    addEventListener('pointerdown', e => { if (!menu.contains(e.target)) close(); }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    addEventListener('scroll', close, { passive: true });

    for (const btn of menu.querySelectorAll('[data-copy]')) {
      const label = btn.innerHTML;
      btn.addEventListener('click', async () => {
        try {
          const svg = await (await fetch(btn.dataset.copy)).text();
          await navigator.clipboard.writeText(svg);
          btn.innerHTML = 'copied <i>✓</i>';
        } catch (err) {
          btn.innerHTML = 'copy failed';
        }
        setTimeout(() => { btn.innerHTML = label; close(); }, 800);
      });
    }
  })();
</script>
