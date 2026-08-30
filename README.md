# Omarchy homepage redesign

A redesign proposal for [omarchy.org](https://omarchy.org) — the homepage as a tiled Hyprland workspace.

![The redesigned homepage in Tokyo Night](assets/preview.png)

## Concept

The page *is* an Omarchy desktop:

- A waybar-style top bar — workspaces `1`–`4` anchor the sections, live clock, theme module.
- Content tiled as windows with focus-follows-mouse borders, each titled by the command that would produce it (`❯ fastfetch`, `❯ ls community/`, `❯ cat 07-hotkeys.md`).
- The ASCII wordmark rendered on canvas: it decrypts on load, scrambles under the cursor, and carries the original logo gradient — re-derived from the active theme's tokens.
- All 20 themes from the [omarchy repo](https://github.com/omacom/omarchy), palettes mapped 1:1 from `themes/*/colors.toml` — pick one in the gallery or cycle with `t`. The choice persists.
- A feature bento built from the manual's own chapters, and videos in a floating mpv-style window (native `<dialog>`).

One static file. No framework, no runtime dependencies — fonts, thumbnails, favicon and web manifest are inlined; the page works offline.

## Files

- `index.src.html` — the source of truth (markup, styles, scripts)
- `404.src.html` — error page source, same design language, no embedded fonts
- `build.sh` — inlines the assets and emits `public/index.html` and `public/404.html`
- `public/` — what gets deployed
- `assets/` — favicon, OG image and video thumbnails from omarchy.org, JetBrains Mono woff2 in `fonts/`
- `wrangler.jsonc` — Cloudflare Workers static-assets config (custom domain, 404 handling)

## Develop

Edit `index.src.html`, run `sh build.sh`, open `public/index.html`.

---

Designed & developed by Daniel Schmier — [captainscor.ch](https://captainscor.ch)
