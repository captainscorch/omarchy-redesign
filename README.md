# Omarchy homepage redesign

A redesign proposal for [omarchy.org](https://omarchy.org) — the homepage as a tiled Hyprland workspace.

![The redesigned homepage in Tokyo Night](assets/preview.png)

## Concept

The page *is* an Omarchy desktop:

- A waybar-style top bar — workspaces `1`–`4` anchor the sections, live clock, theme module.
- The hero boots like the real thing: the sunrise wallpaper plays once, then settles into a quiet loop. The ASCII wordmark decrypts on load, scrambles under the cursor, and carries the original logo gradient — re-derived from the active theme's tokens.
- Content tiled as windows with focus-follows-mouse borders, each titled by the command that would produce it (`❯ fastfetch`, `❯ omarchy plugin add`, `❯ btop`).
- The install section replays a terminal session and puts a four-step "before you boot" checklist beside it — ISO only, the way Omarchy 4 actually installs.
- Real screenshots of the OS, tiled the way Hyprland tiles them, and draggable: pick a window up and drop it on another.
- All 20 themes from the [omarchy repo](https://github.com/omacom/omarchy), palettes mapped 1:1 from `themes/*/colors.toml` — pick one in the gallery or cycle with `t`. The choice persists.
- Six community plugins from the [marketplace](https://plugins.omarchy.org) with their install line, eight posts from X in their authors' words, the project's figures (foundation funding, ISO downloads, stars, a year of commits) drawn as block charts, the three teams, and a news ticker.
- Videos in a floating mpv-style window (native `<dialog>`).

Type is JetBrains Mono for everything terminal — bar, window titles, code, charts — and IBM Plex Sans for headlines and reading copy.

One static file. No framework, no runtime dependencies — fonts, thumbnails, favicon and web manifest are inlined; the page works offline.

## Files

- `index.src.html` — the homepage source (markup, styles, scripts)
- `pages/` — one fragment per subpage: security, teams, patrons, sponsorships, air, meetups, workstations, brand
- `partials/` — the shared shell every subpage is wrapped in: head with bar and base styles, footer, base script, search, brand menu, theme boot
- `content/` — snapshots of the 51 manual chapters and 19 news articles from omarchy.org; `build.sh` turns them into pages with chapter toc, sidebars and prev/next
- `data/` — what the homepage's live sections are built from: `momentum.json` (GitHub stats, funding steps, downloads), `plugins.json` (the marketplace picks), `quotes.json` (the X posts)
- `bin/` — refresh scripts: `momentum` pulls the repo stats from the GitHub API (needs `gh`), `plugins` pulls the catalog and card images from the marketplace
- `404.src.html` — error page source, same design language, no embedded fonts
- `logo-demo.src.html` — standalone autoplay of the bar mark's stroke draw, for demos
- `build.sh` — inlines the assets, renders the data sections, wraps fragments and content, emits `public/`
- `public/` — what gets deployed
- `assets/` — favicon, OG image, thumbnails, brand files and page images from omarchy.org; `media/` holds the hero videos, wallpapers, OS screenshots, plugin shots and avatars
- `fonts/` — JetBrains Mono and IBM Plex Sans as woff2, plus the Nerd Font symbols the bar uses
- `wrangler.jsonc` — Cloudflare Workers static-assets config (custom domain, 404 handling)

## Develop

Edit a source file, run `sh build.sh`, then serve `public/` locally — the site uses absolute paths, so use a server rather than opening files directly:

```sh
python3 -m http.server 8000 -d public
```

Then visit http://localhost:8000.

To refresh the figures and the plugin picks, run `bin/momentum` and `bin/plugins`, then build again. The funding and download figures are quoted from the news posts they link to and kept in `bin/momentum` by hand.

## Attribution

This is an independent design proposal for [omarchy.org](https://omarchy.org). All Omarchy content, imagery and branding — the wordmark, logo, manual, news, photos — belongs to the Omarchy project and the Omacom Foundation; Omarchy is a pending trademark. The quoted posts belong to their authors on X, the plugin screenshots to their authors on the marketplace. JetBrains Mono and IBM Plex Sans ship under the SIL Open Font License (`fonts/OFL.txt`, `fonts/IBMPlexSans-LICENSE.txt`).

---

Designed & developed by Daniel Schmier — [captainscor.ch](https://captainscor.ch)
