# SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
# PumpkinWave 666 pixel art -> app/pumpkin_art.inc (4-bit indexed sprites).
#   python3 tools/pumpkin/art.py [--png out_dir]
# Palette indices (resolved at draw time, so glows can flicker):
#   . 0 transparent    o 1 outline       O 2 pumpkin      h 3 highlight
#   s 4 shadow/rib     g 5 stem          G 6 face glow    Y 7 face core
#   d 8 face dark      w 9 bone/white    r 10 blood       p 11 purple
#   b 12 bat black     e 13 eye ember    v 14 vine green  k 15 (reserved)
import sys, os

def body(w, h, top=3, ribs=(0.38, 0.78), stem=True):
    """Procedural pumpkin: outlined ellipse, curved ribs, lit from the upper left."""
    import math
    cx, cy = (w - 1) / 2, top + (h - top - 1) / 2
    a, b = w / 2 - 0.2, (h - top) / 2 - 0.2
    g = [['.'] * w for _ in range(h)]
    inside = lambda x, y: ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 <= 1.0
    for y in range(h):
        for x in range(w):
            if not inside(x, y): continue
            edge = not all(inside(x + dx, y + dy) for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))
            nx, ny = (x - cx) / a, (y - cy) / b
            c = 'o' if edge else 'O'
            if c == 'O':
                if nx < -0.45 and ny < 0.25 and nx > -0.85: c = 'h'
                if nx + ny > 0.95: c = 's'
                span = math.sqrt(max(0.0, 1 - ny * ny))
                for k in ribs:
                    for sgn in (-1, 1):
                        if abs(nx - sgn * k * span) < 0.5 / a: c = 's'
            g[y][x] = c
    if stem:
        m = int(cx)
        for y, xs in ((0, (m + 1, m + 2)), (1, (m, m + 1)), (2, (m, m + 1))):
            for x in xs:
                if 0 <= x < w: g[y][x] = 'g'
        g[1][m + 2] = 'v'; g[2][m + 2] = 'v'
        if top < h: g[top][m] = g[top][m + 1] = 'g'
    return "\n".join("".join(r) for r in g)

def mirror(half, flip_light=False):
    rows = half.strip("\n").split("\n")
    out = []
    for r in rows:
        m = r[::-1]
        out.append(r + m)
    return "\n".join(out)

PUMPKIN = body(32, 25)
# Left halves (16 columns); the right half is mirrored about the centre line.
FACE_EVIL = mirror("""
................
................
................
................
................
................
....dd..........
....GGdd........
....GGGGdd......
....GYYGGGdd....
.....GYYYGGGd...
......GYYGGG....
.......GGGG.....
..............dd
.............dGG
..............GY
..d.............
..Gdd...........
..GGGdd..ddd..dd
...GGGGddGGGddGG
...GYYGGGGYYGGGY
....GYYYYYYYYYYY
.....GG.GGGG.GGG
.......d....d...
................
""")
FACE_CALM = mirror("""
................
................
................
................
................
................
................
................
......dd........
.....GGGd.......
.....GYYG.......
.....GYYG.......
......GG........
................
..............dd
..............GG
................
...d............
...Gd...........
....GGd.........
.....GGGdddd..dd
......GYYYYGddGY
........GGGGGGGG
................
................
""")
FACE_POSSESSED = mirror("""
................
................
................
................
................
...d............
...Gd...........
...GGdd.........
...GGGGdd.......
...GGrrGGdd.....
....GGrrrGGd....
.....GGrGGG.....
.......GGG......
.............d.d
.............GdG
.............G.G
.d..............
.Gd.d.d.d.d.d.d.
.GGdGdGdGdGdGdGd
..GGGGGGGGGGGGGG
..GYYYGGGGYYYGGG
...GYYYYYYYYYYYY
....GG.G.G.G.G.G
.....G.........G
................
""")
MINI = """
......gg.....
.....gv......
..oooggooo...
.oOOOsOsOOOo.
oOOGOsOsOGOOo
oOGGGsOsGGGOo
oOOOOsOsOOOOo
oOGOGOGOGOGOo
oOOGGGGGGGOOo
.oOOsOOOsOOo.
..ooooooooo..
"""
BADGE_OLD = """
.......gg.........
.......gv.........
...oooogooooo.....
..oOOOOsOsOOOOo...
.oOOOOsOOOsOOOOo..
oOOOOOsOOOsOOOOOo.
oOOOOOsOOOsOOOOOo.
oOOOOOsOOOsOOOOOo.
oOOOOOsOOOsOOOOOo.
oOOOOOsOOOsOOOOOo.
oOOOOOsOOOsOOOOOo.
.oOOOOsOOOsOOOOo..
..ooOOOsOsOOOoo...
....ooooooooo.....
"""
BAT_UP = """
b.........b
bb.......bb
bbb.b.b.bbb
.bbbbbbbbb.
..bbbebbb..
.....b.....
"""
BAT_DOWN = """
...........
....b.b....
.bbbbbbbbb.
bbbbbebbbbb
bb...b...bb
b.........b
"""
SKULL = """
..wwwww..
.wwwwwww.
wwwwwwwww
wddwwwddw
wddwwwddw
wwwwdwwww
.wwwwwww.
..wdwdw..
"""
CANDLE = """
...e...
..eYe..
..eYe..
...G...
.wwwww.
"""
BADGE = body(18, 14, top=2, ribs=(0.45,))
MINI_BODY = body(13, 11, top=2, ribs=(0.5,))
SPRITES = [("pumpkin", PUMPKIN), ("face_evil", FACE_EVIL), ("face_calm", FACE_CALM),
           ("face_possessed", FACE_POSSESSED), ("mini", MINI), ("badge", BADGE),
           ("bat_up", BAT_UP), ("bat_down", BAT_DOWN), ("skull", SKULL), ("candle", CANDLE)]
KEY = {'.': 0, ' ': 0, 'o': 1, 'O': 2, 'h': 3, 's': 4, 'g': 5, 'G': 6, 'Y': 7, 'd': 8,
       'w': 9, 'r': 10, 'p': 11, 'b': 12, 'e': 13, 'v': 14}

def grid(art):
    rows = [r for r in art.strip("\n").split("\n")]
    w = max(len(r) for r in rows)
    return [[KEY[c] for c in r.ljust(w, '.')] for r in rows], w, len(rows)

def emit():
    out = ["/* SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception",
           " * PumpkinWave 666 pixel art. Generated by tools/pumpkin/art.py - edit there.",
           " * 4-bit palette indices, two pixels per byte, high nibble first. */"]
    for name, art in SPRITES:
        g, w, h = grid(art)
        flat = [v for row in g for v in row]
        if len(flat) % 2: flat.append(0)
        data = [(flat[i] << 4) | flat[i + 1] for i in range(0, len(flat), 2)]
        out.append(f"enum {{ ART_{name.upper()}_W = {w}, ART_{name.upper()}_H = {h} }};")
        lines = [", ".join(f"0x{b:02x}" for b in data[i:i + 16]) for i in range(0, len(data), 16)]
        out.append(f"static const uint8_t art_{name}[] = {{\n    " + ",\n    ".join(lines) + "\n};")
    return "\n".join(out) + "\n"

PREVIEW = {0: (10, 4, 16), 1: (50, 14, 0), 2: (214, 92, 0), 3: (250, 146, 24), 4: (150, 52, 0),
           5: (60, 120, 30), 6: (255, 200, 40), 7: (255, 250, 190), 8: (40, 8, 0), 9: (235, 228, 210),
           10: (220, 10, 20), 11: (110, 40, 160), 12: (24, 8, 36), 13: (255, 80, 0), 14: (90, 170, 40)}

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "..", "..", "app", "pumpkin_art.inc"), "w") as f:
        f.write(emit())
    if "--png" in sys.argv:
        from PIL import Image
        outdir = sys.argv[sys.argv.index("--png") + 1]
        body, bw, bh = grid(PUMPKIN)
        for name, art in SPRITES:
            g, w, h = grid(art)
            img = Image.new("RGB", (w, h))
            for y in range(h):
                for x in range(w):
                    v = g[y][x]
                    if name.startswith("face") and v == 0 and y < bh and x < bw: v = body[y][x]
                    img.putpixel((x, y), PREVIEW[v])
            img.resize((w * 8, h * 8), Image.NEAREST).save(os.path.join(outdir, name + ".png"))
    print("pumpkin_art.inc written")
