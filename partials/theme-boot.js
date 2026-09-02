<script>
/* sets the theme before first paint, the page script validates it again later */
(() => {
  const alias = { light: 'flexoki-light', dark: 'tokyo-night' };
  const param = new URLSearchParams(location.search).get('theme');
  let theme = alias[param] || param;
  try { theme = theme || localStorage.getItem('omarchy-redesign-theme-v1'); } catch {}
  document.documentElement.dataset.theme =
    theme || (matchMedia('(prefers-color-scheme: dark)').matches ? alias.dark : alias.light);
})();
</script>
