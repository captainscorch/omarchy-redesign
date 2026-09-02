#!/bin/sh
# Builds public/ (what Cloudflare deploys) from index.src.html:
#   public/index.html — complete standalone document (the actual page)
#   public/404.html   — error page with the same theme tokens
# The video thumbnails and the JetBrains Mono woff2 files (fonts/, from
# github.com/JetBrains/JetBrainsMono) are inlined as data URIs, so the
# result is fully self-contained and covers the block glyphs the canvas
# wordmark scrambles with. The OG image ships alongside — link previews
# need a plain file URL.
mkdir -p public/assets
cp assets/opengraph.png public/assets/opengraph.png
# logo-demo.html: standalone autoplay of the bar mark's stroke draw, for demos.
python3 - <<'EOF'
import base64
def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()
src = open("logo-demo.src.html").read()
src = src.replace("__FAVICON_B64__", b64("assets/favicon.png"))
open("public/logo-demo.html", "w").write(src)
EOF
python3 - <<'EOF'
import base64
import json
import os
import re
import shutil

def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()

src = open("index.src.html").read()
src = src.replace("__QUATTRO_B64__", b64("assets/video-quattro.webp"))
src = src.replace("__CHUCK_B64__", b64("assets/video-networkchuck.webp"))
favicon = b64("assets/favicon.png")
src = src.replace("__FAVICON_B64__", favicon)

# --- news: one list drives the /news/ pages and the homepage ticker ---
NEWS = [
    ("2026/08/omacom-foundation-welcomes-brian-armstrong-and-yunjie-dai", "Omacom Foundation welcomes Brian Armstrong and Yunjie Dai", "August 31, 2026",
     "Two more Founding Patrons join the mission with $1 million each, and the foundation hits $12 million."),
    ("2026/08/1password-and-37signals-become-distinguished-corporate-patrons", "1Password and 37signals become Distinguished Corporate Patrons", "August 31, 2026",
     "The first two Distinguished Corporate Patrons each pledge $100,000 a year for three years, taking the Omacom Foundation to $12.6 million."),
    ("2026/08/the-first-plugin-competition-winners", "The first plugin competition winners", "August 28, 2026",
     "Radio Atlas, Omagotchi, and AirPods take the podium in the first Omarchy plugin competition."),
    ("2026/08/introducing-omarchy-air", "Introducing Omarchy AIR", "August 28, 2026",
     "A six-month, funded residency for the artists who make Omarchy beautiful. The first two are HANCORE and OldJobobo."),
    ("2026/08/100000-downloads-in-a-week", "Omarchy tops 100,000 downloads in a week", "August 28, 2026",
     "A hundred thousand people installed Omarchy in seven days, and we moved nearly a petabyte doing it."),
    ("2026/08/introducing-the-omarchy-rangers", "Introducing Omarchy Rangers", "August 27, 2026",
     "The first Omarchy Rangers are here to help people find their way, and applications are open."),
    ("2026/08/omacom-foundation-to-be-premier-mise-sponsor", "Omacom Foundation to be premier mise sponsor", "August 25, 2026",
     "Third sponsorship out the door! The Omacom Foundation is becoming a premier sponsor of mise, and thereby of jdx."),
    ("2026/08/omarchy-meetups-around-the-world", "Omarchy meetups around the world", "August 24, 2026",
     "Find an Omarchy meetup near you or start one yourself and add it to the global calendar."),
    ("2026/08/omacom-foundation-to-be-premier-quickshell-sponsor", "Omacom Foundation to be premier Quickshell sponsor", "August 24, 2026",
     "More money in, more money out! Our second major sponsorship from the Omacom Foundation is going to outfoxxed for his superb work on Quickshell."),
    ("2026/08/omacom-foundation-funding-hits-10m", "Omacom Foundation funding hits $10m", "August 24, 2026",
     "Drew Houston and Peter Steinberger join the Omacom Foundation as Founding Patrons, taking total funding to $10 million."),
    ("2026/08/omacom-foundation-to-be-exclusive-hyprland-sponsor", "Omacom Foundation to be exclusive Hyprland sponsor", "August 21, 2026",
     "What better way to start spending some of the treasure we just raised for the Omacom Foundation than on the most cracked Linux kid in Poland: Vaxry!"),
    ("2026/08/omacom-foundation-launches-with-8-million", "Omacom Foundation launches with $12.6 million", "August 21, 2026",
     "It's time to dream big. Omarchy Quattro has given people a chance to experience what the malleable computer of the future looks like, and they like it (a lot!)."),
    ("2026/09/the-omarchy-core-team", "The Omarchy Core Team", "August 19, 2026",
     "Omarchy's explosive growth demands structured teams in response, starting with The Omarchy Core Team."),
    ("2026/08/the-first-plugin-competition", "The first plugin competition", "August 19, 2026",
     "The Omarchy Plugin Marketplace is already home to over 500 plugins and growing very fast."),
]

# homepage news slider: the latest headlines as snap-scrolling cards
news_cards = "\n".join(
    '<a class="newsrow__card" href="/news/%s/"><time>%s</time><span class="newsrow__title">%s</span><p>%s</p></a>'
    % (path, date, title, teaser)
    for path, title, date, teaser in NEWS[:6]
)
src = src.replace("<!--NEWS_CARDS-->", news_cards)

# --- voices: data/quotes.json, posts quoted as written, linked to the original ---
import html as H
def linkify(text):
    text = H.escape(text)
    text = re.sub(r'(https?://[^\s<]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', text)
    return re.sub(r'(^|\s)@([A-Za-z0-9_]{1,15})', r'\1<a href="https://x.com/\2" target="_blank" rel="noopener">@\2</a>', text)
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
def short_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{MONTHS[m - 1]} {d}"
quotes = json.load(open("data/quotes.json"))
def quote_card(i, q):
    name = H.escape(q["name"])
    return (
        f'<article class="win quote" style="--i: {i}">'
        f'<p class="quote__text">{linkify(q["text"])}</p>'
        '<footer class="quote__by">'
        f'<img src="{q["avatar"]}" width="32" height="32" alt="" loading="lazy" decoding="async">'
        f'<span class="quote__who"><b>{name}</b>'
        f'<span>@{q["handle"]} · {short_date(q["date"])}</span></span>'
        f'<a class="quote__src" href="{q["url"]}" target="_blank" rel="noopener" '
        f'aria-label="Open the post by {name} on X">on X</a>'
        '</footer></article>'
    )
quote_cards = "\n".join(quote_card(i, q) for i, q in enumerate(quotes))
src = src.replace("<!--QUOTE_CARDS-->", quote_cards)

# --- momentum: data/momentum.json (bin/momentum refreshes it from GitHub) ---
m = json.load(open("data/momentum.json"))
g = m["github"]
# funding steps as bars scaled to the total, one row per news post
W = 22
steps = "\n".join(
    f'<i>{date}</i>  ' + "█" * round(W * amount / m["foundation"]["total"]) + f'  ${amount:g}M'
    for date, amount, path in m["foundation"]["steps"]
)
# commits per week as eight rows of eighth-blocks, oldest week left
weeks, ROWS = g["weeks"], 8
top = max(weeks) or 1
EIGHTHS = " ▁▂▃▄▅▆▇"
def cell(v, row):
    e = round(v / top * ROWS * 8) - (ROWS - 1 - row) * 8
    return "█" if e >= 8 else EIGHTHS[max(0, e)]
commits = "\n".join("".join(cell(v, r) for v in weeks) for r in range(ROWS))
src = (src.replace("<!--STAT_STEPS-->", steps).replace("<!--STAT_COMMITS-->", commits)
    .replace("__M_STARS_FMT__", f"{g['stars']:,}").replace("__M_STARS__", str(g["stars"]))
    .replace("__M_FORKS_FMT__", f"{g['forks']:,}").replace("__M_CONTRIB__", str(g["contributors"]))
    .replace("__M_COMMITS_FMT__", f"{g['commits_52w']:,}").replace("__M_COMMITS__", str(g["commits_52w"]))
    .replace("__M_CHECKED__", short_date(m["checked"])))

# no start_url: a data-URI manifest has an opaque origin, the browser falls
# back to the document URL anyway and skips the console warning
manifest = json.dumps({
    "name": "Omarchy",
    "short_name": "Omarchy",
    "display": "browser",
    "background_color": "#f2efe4",
    "theme_color": "#f2efe4",
    "icons": [{
        "src": "data:image/png;base64," + favicon,
        "sizes": "300x300",
        "type": "image/png",
    }],
})
src = src.replace("__MANIFEST_B64__", base64.b64encode(manifest.encode()).decode())

faces = []
for name, weight in [("Light", 300), ("Regular", 400), ("Medium", 500), ("Bold", 700), ("ExtraBold", 800)]:
    b64 = base64.b64encode(open(f"fonts/JetBrainsMono-{name}.woff2", "rb").read()).decode()
    faces.append(
        "@font-face{font-family:'JetBrains Mono';font-style:normal;"
        f"font-weight:{weight};font-display:swap;"
        f"src:url(data:font/woff2;base64,{b64}) format('woff2');}}"
    )

# Symbols Nerd Font Mono, subset to the eleven codepoints the command menu
# draws (the ten navigation rows plus the empty-state glyph).
menu_font = (
    "@font-face{font-family:'Omarchy Menu Symbols';font-style:normal;"
    "font-weight:400;font-display:block;"
    "src:url(data:font/woff2;base64,"
    + base64.b64encode(open("fonts/SymbolsNerdFontMono-Menu.woff2", "rb").read()).decode()
    + ") format('woff2');}"
)
src = src.replace("__FONT_FACES__", "".join(faces) + menu_font)

page = src

# The document head ends after the second </style> (font faces, then main styles).
first_end = page.index("</style>") + len("</style>")
second_end = page.index("</style>", first_end) + len("</style>")
head, body = page[:second_end], page[second_end:]
# The comment art is the same OMARCHY block art the page renders — taken
# from the logo fallback <pre> so the two can never drift apart.
art_start = page.index('id="logo-fallback"')
art_start = page.index(">", art_start) + 1
art = page[page.index("\n", art_start) + 1:page.index("</pre>", art_start)]
credit = (
    "<!--\n\n" + art + "\n\n"
    "Omarchy homepage redesign proposal — omarchy.org reimagined as a tiled\n"
    "Hyprland workspace. One static file, no framework, no build step.\n\n"
    "Designed & developed by Daniel Schmier (https://captainscor.ch)\n\n"
    "-->\n"
)
doc = (
    credit
    + '<!doctype html>\n<html lang="en">\n<head>\n'
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, viewport-fit=cover, initial-scale=1, minimal-ui, maximum-scale=1, user-scalable=no">\n'
    + head + "\n</head>\n<body>" + body + "\n" + open("partials/search.js").read()
    + open("partials/logo-menu.js").read() + "</body>\n</html>\n"
)
open("public/index.html", "w").write(doc)

# 404 and brand pages: same theme tokens as the main page, injected so
# they never drift.
tokens = src[src.index("/* ================= Omarchy theme tokens ================= */"):src.index("* { box-sizing")]
p404 = open("404.src.html").read().replace("__THEME_TOKENS__", tokens.rstrip() + "\n")
open("public/404.html", "w").write(p404)

# ---------------------------------------------------------------------------
# Subpages. pages/<slug>.html fragments are wrapped in the shared partials
# (bar, theme tokens, footer, base script); a fragment may start with an
# <!--css ... --> block that becomes page-specific CSS. The manual chapters
# and news articles are generated from the snapshots in content/ (taken from
# omarchy.org, see content/meta.json).
head = open("partials/head.html").read()
foot = open("partials/foot.html").read()
search_js = open("partials/search.js").read()
base_js = search_js + open("partials/logo-menu.js").read() + open("partials/base.js").read()
sindex = []
PARTNER_LINE = '  <p>Looking to become a partner or patron of Omarchy? Write <a href="mailto:david@omarchy.org">david@omarchy.org</a></p>\n'

def render(path, title, desc, bar_title, body, page_css="", partner=True):
    page = (
        head.replace("__TITLE__", title)
            .replace("__DESC__", desc)
            .replace("__PATH__", path)
            .replace("__BAR_TITLE__", bar_title)
            .replace("__PAGE_CSS__", page_css)
            .replace("__THEME_TOKENS__", tokens.rstrip() + "\n")
            .replace("__MENU_FONT__", menu_font)
            .replace("__FAVICON_B64__", favicon)
        + "\n" + body + "\n" + (foot if partner else foot.replace(PARTNER_LINE, "")) + "\n" + base_js
    )
    out = "public" + path + "index.html"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(page)

# --- plain fragment pages (the partner line stays out where the page body
# already carries that exact ask) ---
PAGES = {
    "security": ("Security — Omarchy", "How to report a security vulnerability in Omarchy.", "security", True),
    "teams": ("Teams — Omarchy", "The teams guiding Omarchy: Core, Security, and the Rangers.", "the teams", True),
    "patrons": ("Patrons — Omarchy", "The Omacom Foundation and the patrons funding the mission.", "the patrons", False),
    "sponsorships": ("Sponsorships — Omarchy", "The projects funded by the Omacom Foundation.", "sponsorships", True),
    "air": ("Artists in Residence — Omarchy", "A six-month residency for the artists who make Omarchy beautiful.", "artists in residence", True),
    "meetups": ("Meetups — Omarchy", "Omarchy meetups around the world, and how to run your own.", "meetups", True),
    "workstations": ("Workstations — Omarchy", "Community workstations running Omarchy.", "workstations", True),
    "brand": ("Brand — Omarchy", "The official Omarchy logo and wordmark, and the terms for using them.", "the brand", False),
}

sindex.append({"t": "Home — the desktop", "c": "page", "p": "/"})
sindex.append({"t": "Theme gallery", "c": "home", "p": "/#ws3"})
sindex.append({"t": "Heard on the timeline", "c": "home", "p": "/#voices"})
sindex.append({"t": "Real money, real commits", "c": "home", "p": "/#momentum"})
for slug, (title, desc, bar_title, partner) in PAGES.items():
    sindex.append({"t": title.split(" — ")[0], "c": "page", "p": f"/{slug}/"})
for slug, (title, desc, bar_title, partner) in PAGES.items():
    frag = open(f"pages/{slug}.html").read()
    page_css = ""
    if frag.startswith("<!--css"):
        end = frag.index("-->")
        page_css = frag[len("<!--css"):end]
        frag = frag[end + len("-->"):].lstrip("\n")
    render(f"/{slug}/", title, desc, bar_title, frag, page_css, partner)

# --- the manual: one page per chapter, sticky chapter toc, prev/next ---
meta = json.load(open("content/meta.json"))
chapters = meta["chapters"]

def chapter_href(ch):
    return "/manual/" if ch["slug"] == "" else f"/manual/{ch['slug']}/"

toc_items = "\n".join(
    f'        <li><a href="{chapter_href(ch)}"__CURRENT_{i}__>{ch["title"]}</a></li>'
    for i, ch in enumerate(chapters)
)

for i, ch in enumerate(chapters):
    content = open(f"content/manual/{ch['file']}.html").read()
    sindex.append({"t": ch["title"], "c": "manual", "p": chapter_href(ch)})
    for sid, heading in re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', content, re.S):
        text = re.sub(r"<[^>]+>", "", heading).strip().rstrip("#").strip()
        sindex.append({"t": text, "c": f"manual · {ch['title']}", "p": f"{chapter_href(ch)}#{sid}"})
    toc = toc_items
    for j in range(len(chapters)):
        toc = toc.replace(f"__CURRENT_{j}__", ' aria-current="page"' if j == i else "")
    pager = '<div class="pager">'
    if i > 0:
        p = chapters[i - 1]
        pager += f'<a href="{chapter_href(p)}"><span class="dir">← previous</span>{p["title"]}</a>'
    if i < len(chapters) - 1:
        n = chapters[i + 1]
        pager += f'<a class="pager__next" href="{chapter_href(n)}"><span class="dir">next →</span>{n["title"]}</a>'
    pager += "</div>"
    body = f"""<div class="desktop">
  <div class="docs">
    <aside class="docs__toc win" aria-label="Chapters">
      <p class="win__title">Chapters</p>
      <button class="docs__search" type="button" data-search-open="manual">search the manual<kbd data-kbd-search>⌘K</kbd></button>
      <div class="docs__toc-body">
      <ol>
{toc}
      </ol>
      </div>
    </aside>
    <section class="win" aria-label="{ch['title']}">
      <p class="win__title">Manual &middot; chapter {i + 1:02d}</p>
      <h1>{ch['title']}</h1>
      <div class="prose">
{content}
      </div>
      {pager}
    </section>
  </div>
</div>"""
    render(chapter_href(ch), f"{ch['title']} — The Omarchy Manual",
           f"The Omarchy manual: {ch['title']}.", "the manual", body)

# --- news: index list plus one page per article with an index sidebar ---
# (NEWS itself is defined up top, next to the homepage ticker it also feeds)

news_index_items = "\n".join(
    f"""      <a class="news-card" href="/news/{path}/">
        <p class="news-meta"><span class="no">{i:02d}</span> DHH on {date}</p>
        <h2>{title}</h2>
        <p class="teaser">{teaser}</p>
      </a>"""
    for i, (path, title, date, teaser) in enumerate(NEWS, 1)
)
news_css = """
  .news-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 700px) { .news-grid { grid-template-columns: 1fr; } }
  .news-card {
    display: block; padding: 14px 16px;
    border: 1.5px solid var(--border); border-radius: 0;
    text-decoration: none; color: var(--fg);
    transition: border-color 0.15s, background 0.12s;
  }
  .news-card:hover { border-color: var(--accent); background: var(--surface); }
  .news-meta { margin: 0 0 6px; font-size: 0.6875rem; color: var(--muted); }
  .news-meta .no { color: var(--warn); font-weight: 700; margin-right: 0.5ch; }
  .news-card h2 { margin: 0 0 6px; font-size: 0.9375rem; letter-spacing: -0.01em; }
  .news-card h2::after { content: " ↗"; color: var(--accent-2); opacity: 0; transition: opacity 0.12s; }
  .news-card:hover h2::after { opacity: 1; }
  .news-card .teaser { margin: 0; color: var(--muted); font-size: 0.8125rem; }
"""
render("/news/", "News — Omarchy", "Announcements, releases, and other Omarchy news.", "news",
       f"""<div class="desktop">
  <header class="page-head">
    <p class="eyebrow">news</p>
    <h1>Announcements, releases, and other news</h1>
  </header>
  <section class="win" aria-label="News">
    <p class="win__title">Latest news</p>
    <div class="news-grid">
{news_index_items}
    </div>
  </section>
</div>""", news_css)

news_sidebar = "\n".join(
    f'        <a href="/news/{p}/"__NCURRENT_{i}__>{t}<span class="date">{d}</span></a>'
    for i, (p, t, d, _) in enumerate(NEWS)
)
for i, (path, title, date, teaser) in enumerate(NEWS):
    content = open(f"content/news/{path.replace('/', '-')}.html").read()
    sidebar = news_sidebar
    for j in range(len(NEWS)):
        sidebar = sidebar.replace(f"__NCURRENT_{j}__", ' aria-current="page"' if j == i else "")
    pager = '<div class="pager">'
    if i > 0:
        pager += f'<a href="/news/{NEWS[i - 1][0]}/"><span class="dir">← newer</span>{NEWS[i - 1][1]}</a>'
    if i < len(NEWS) - 1:
        pager += f'<a class="pager__next" href="/news/{NEWS[i + 1][0]}/"><span class="dir">older →</span>{NEWS[i + 1][1]}</a>'
    pager += "</div>"
    body = f"""<div class="desktop">
  <div class="article-grid">
    <section class="win" aria-label="{title}">
      <div class="win__head"><p class="win__title">News</p><a class="win__more" href="/news/">all news</a></div>
      <h1>{title}</h1>
      <div class="prose">
{content}
      </div>
      {pager}
    </section>
    <aside class="win" aria-label="All news">
      <p class="win__title">All news</p>
      <div class="index-list">
{sidebar}
      </div>
    </aside>
  </div>
</div>"""
    render(f"/news/{path}/", f"{title} — Omarchy", teaser, "news", body)

for path, title, date, teaser in NEWS:
    short = f"{date[:3]} {date.split(' ')[1].rstrip(',')}"
    sindex.append({"t": title, "c": f"news · {short}", "p": f"/news/{path}/"})
for e in sindex:
    e["k"] = (e["t"] + " " + e["c"]).lower()
json.dump(sindex, open("public/assets/search-index.json", "w"))

# --- static assets ---
for name in ("omarchy-wordmark.svg", "omarchy-wordmark.png", "omarchy-logo.svg", "omarchy-logo.png"):
    shutil.copyfile(f"assets/brand/{name}", f"public/brand/{name}")
shutil.copytree("assets/img", "public/assets/img", dirs_exist_ok=True)
# boot video, wallpapers, screenshots and video thumbnails
shutil.copytree("assets/media", "public/assets/media", dirs_exist_ok=True)
# web text effects runtime — the hero wordmark's laseretch playback
shutil.copytree("assets/wte", "public/assets/js/wte", dirs_exist_ok=True)
os.makedirs("public/assets/fonts", exist_ok=True)
for name in ("Light", "Regular", "Medium", "Bold", "ExtraBold"):
    shutil.copyfile(f"fonts/JetBrainsMono-{name}.woff2", f"public/assets/fonts/JetBrainsMono-{name}.woff2")
EOF
