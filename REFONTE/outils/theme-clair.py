# -*- coding: utf-8 -*-
"""Convertit les classes du verre sombre (text-white/40, bg-black/45…) vers
les jetons sémantiques du back-office (text-ink-3, bg-panel…).

  python REFONTE/outils/theme-clair.py            # applique
  python REFONTE/outils/theme-clair.py --sec      # compte sans écrire

Le texte posé sur une photo garde ses classes : le conteneur reçoit
.tc-dark, qui redéfinit les jetons en clair-sur-sombre."""
import io, re, sys, glob, os

ROOTS = [
    "src/app/dashboard", "src/app/hotel", "src/app/concierge", "src/app/admin",
    "src/components/hotel", "src/components/admin",
]
FILES = [
    "src/components/shared/messenger.tsx", "src/components/shared/stat-strip.tsx",
    "src/components/shared/status-badge.tsx", "src/components/shared/mini-charts.tsx",
    "src/components/shared/loading-skeleton.tsx", "src/components/shared/avatar-uploader.tsx",
    "src/components/shared/avatar.tsx",
]
SKIP = {"src/components/hotel/ui.tsx"}

SOLID = re.compile(r"(?<![\w:-])(?:hover:)?bg-(?:sky|blue|emerald|red|green|violet|purple|indigo|rose|orange|link|ok|danger|brand|ink)(?:-(?:500|600|700))?(?![\w/-])")
DARKBG = re.compile(r"(?<![\w-])bg-black(?:/(?:70|75|80|85|90))?(?![\w/\[])")

def alpha(m):
    v = m
    if v is None: return 100.0
    v = v.strip("[]")
    f = float(v)
    return f * 100 if f <= 1 else f

def text_white(m):
    a = alpha(m.group(2))
    if m.group(1): return "placeholder:text-ink-4"
    if a >= 80: return "text-ink"
    if a >= 60: return "text-ink-2"
    if a >= 22: return "text-ink-3"
    return "text-ink-4"

def bg_white(m):
    a = alpha(m.group(2))
    pre = m.group(1) or ""
    if a >= 85: return pre + "bg-brand-strong"
    if a <= 6: return pre + "bg-fill"
    if a <= 12: return pre + "bg-fill-2"
    return pre + "bg-fill-3"

def border_white(m):
    kind, a = m.group(1), alpha(m.group(2))
    if kind == "divide": return "divide-line"
    if kind == "ring": return "ring-line-2"
    return f"{kind}-line" if a <= 12 else f"{kind}-line-2"

TONES = [
    (r"emerald|green", "ok"), (r"amber|yellow|orange", "warn"), (r"red|rose", "danger"),
    (r"sky|blue|indigo|cyan", "info"), (r"violet|purple", "plum"),
]

def convert_line(line):
    keep_white = bool(SOLID.search(line) or DARKBG.search(line))
    on_photo = "from-black" in line or "to-black" in line or "via-black" in line
    s = line
    # tailles sous 12 px
    s = re.sub(r"text-\[(?:8|9|10|11)px\]|text-\[0\.(?:5|5625|625|6875)rem\]", "text-xs", s)
    # capitales espacées
    s = re.sub(r"\s?\buppercase\b", "", s)
    s = re.sub(r"\s?tracking-(?:\[0\.\d+em\]|wider|widest)", "", s)
    s = re.sub(r"\s?(?:-webkit-)?backdrop-blur(?:-\w+)?(?![\w-])", "", s)
    s = s.replace(" [color-scheme:dark]", "")
    if on_photo:
        return s
    # voiles et panneaux
    if "inset-0" in s:
        s = re.sub(r"(?<![\w:-])bg-black/\d+", "bg-scrim", s)
    s = re.sub(r"(?<![\w-])bg-black/(?:70|75|80|85|90)(?![\w])", "bg-ink", s)
    s = re.sub(r"(?<![\w-])bg-black(?![\w/\[-])", "bg-ink", s)
    s = re.sub(r"((?:hover:|focus:|group-hover:)?)bg-black/(?:\[[0-9.]+\]|\d+)", lambda m: m.group(1) + ("bg-fill" if m.group(1) else "bg-panel"), s)
    s = re.sub(r"bg-\[#(?:0e1116|101318|14161c|10131f|0d0f12|141210)\](?:/\d+)?", "bg-panel", s)
    # bouton blanc sur noir → bleu nuit
    if re.search(r"(?<![\w/:-])bg-white(?![\w/\[-])", s) and "text-black" in s:
        s = re.sub(r"(?<![\w/:-])bg-white(?![\w/\[-])", "bg-brand", s)
        s = re.sub(r"(?<![\w-])text-black(?![\w/\[-])", "text-on-brand", s)
        keep_white = True
    s = re.sub(r"((?:hover:|focus:|group-hover:|active:)?)bg-white/(\[[0-9.]+\]|\d+)", bg_white, s)
    s = re.sub(r"(?<![\w-])text-black(?:/(\d+))?(?![\w\[-])", lambda m: "text-ink" if alpha(m.group(1)) >= 70 else "text-ink-2", s)
    s = re.sub(r"(?<![\w-])bg-black/10", "bg-fill-3", s)
    # texte
    s = re.sub(r"(placeholder:)?text-white/(\[[0-9.]+\]|\d+)", text_white, s)
    if not keep_white:
        s = re.sub(r"(?<![\w/-])text-white(?![\w/\[-])", "text-ink", s)
    # filets
    s = re.sub(r"\b(border|divide|ring|border-[trblxy])-white/(\[[0-9.]+\]|\d+)", border_white, s)
    s = re.sub(r"\b(border|ring)-white(?![\w/\[-])", r"\1-line-2", s)
    s = re.sub(r"decoration-white/\d+", "decoration-ink-4", s)
    # teintes
    for pat, tone in TONES:
        s = re.sub(rf"\btext-(?:{pat})-(?:200|300|400|500|600)(?:/\d+)?", f"text-{tone}", s)
        s = re.sub(rf"\bbg-(?:{pat})-(?:400|500|600)/(?:\[[0-9.]+\]|\d+)", f"bg-{tone}-soft", s)
        s = re.sub(rf"\bbg-(?:{pat})-100\b", f"bg-{tone}-soft", s)
        s = re.sub(rf"\b(border|ring)-(?:{pat})-(?:300|400|500)(?:/(?:\[[0-9.]+\]|\d+))?", rf"\1-{tone}/25", s)
        s = re.sub(rf"\bhover:bg-(?:{pat})-(?:300|400|600)(?![\w/])", f"hover:bg-{tone}-strong" if tone == "info" else "hover:brightness-95", s)
        s = re.sub(rf"(?<![\w:-])bg-(?:{pat})-(?:400|500|600)(?![\w/])", f"bg-{'link' if tone == 'info' else tone}", s)
    s = s.replace("hover:bg-info-strong", "hover:bg-link-strong")
    s = s.replace("scrollbar-thin", "scrollbar-thin")
    return s

def main():
    dry = "--sec" in sys.argv
    paths = list(FILES)
    for r in ROOTS:
        paths += glob.glob(r + "/**/*.tsx", recursive=True)
    changed = 0
    for p in sorted(set(x.replace(os.sep, "/") for x in paths)):
        if p in SKIP or not os.path.exists(p): continue
        src = io.open(p, encoding="utf-8").read()
        out = "".join(convert_line(l) for l in src.splitlines(keepends=True))
        if out != src:
            changed += 1
            if not dry:
                io.open(p, "w", encoding="utf-8", newline="\n").write(out)
    print(f"{changed} fichiers convertis")

main()
