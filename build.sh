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
python3 - <<'EOF'
import base64
import json

def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()

src = open("index.src.html").read()
src = src.replace("__QUATTRO_B64__", b64("assets/video-quattro.webp"))
src = src.replace("__CHUCK_B64__", b64("assets/video-networkchuck.webp"))
favicon = b64("assets/favicon.png")
src = src.replace("__FAVICON_B64__", favicon)

# no start_url: a data-URI manifest has an opaque origin, the browser falls
# back to the document URL anyway and skips the console warning
manifest = json.dumps({
    "name": "Omarchy",
    "short_name": "Omarchy",
    "display": "browser",
    "background_color": "#13141c",
    "theme_color": "#13141c",
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
src = src.replace("__FONT_FACES__", "".join(faces))

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
    + head + "\n</head>\n<body>" + body + "\n</body>\n</html>\n"
)
open("public/index.html", "w").write(doc)

# 404 page: same theme tokens as the main page, injected so they never drift.
tokens = src[src.index("/* ================= Omarchy theme tokens ================= */"):src.index("* { box-sizing")]
p404 = open("404.src.html").read().replace("__THEME_TOKENS__", tokens.rstrip() + "\n")
open("public/404.html", "w").write(p404)
EOF
