# Regenerates the inline isometric <svg class="city"> in index.html.
# Usage:  python3 assets/city/gen_city.py > city.svg  then paste over the existing <svg class="city">...</svg>.
# No dependencies beyond the Python standard library.
#!/usr/bin/env python3
"""Generate an isometric SVG 'city' (static markup) for the hero of the site.

World axes: x -> right/down on screen, z -> left/down on screen, y -> up.
Screen: sx = (x - z) * K ; sy = (x + z) * K / 2 - y * K
"""
import math

K = 18.0

def P(x, y, z):
    return ((x - z) * K, (x + z) * K / 2 - y * K)

def fmt(pts):
    return " ".join(f"{sx:.1f},{sy:.1f}" for sx, sy in pts)

def shade(hexcol, f):
    if hexcol.startswith("var("):
        return hexcol
    h = hexcol.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r, g, b = [max(0, min(255, round(c * f))) for c in (r, g, b)]
    return f"#{r:02x}{g:02x}{b:02x}"

def poly(pts, fill, cls=None, extra=""):
    c = f' class="{cls}"' if cls else ""
    return f'<polygon points="{fmt(pts)}" fill="{fill}"{c}{extra}/>'

TOP, LEFT, RIGHT = 1.0, 0.86, 0.72   # face shading multipliers

def box(x0, y0, z0, w, h, d, col, shades=(TOP, LEFT, RIGHT), cls=None):
    """Return SVG for a box with visible top, +z (left) and +x (right) faces."""
    t, l, r = shades
    out = []
    out.append(poly([P(x0, y0 + h, z0), P(x0 + w, y0 + h, z0),
                     P(x0 + w, y0 + h, z0 + d), P(x0, y0 + h, z0 + d)], shade(col, t), cls))
    out.append(poly([P(x0, y0, z0 + d), P(x0 + w, y0, z0 + d),
                     P(x0 + w, y0 + h, z0 + d), P(x0, y0 + h, z0 + d)], shade(col, l), cls))
    out.append(poly([P(x0 + w, y0, z0), P(x0 + w, y0, z0 + d),
                     P(x0 + w, y0 + h, z0 + d), P(x0 + w, y0 + h, z0)], shade(col, r), cls))
    return "".join(out)

def rect_z(x1, y1, x2, y2, zf, col):
    """Rectangle lying on a +z facing wall at depth zf."""
    return poly([P(x1, y1, zf), P(x2, y1, zf), P(x2, y2, zf), P(x1, y2, zf)], col)

def rect_x(z1, y1, z2, y2, xf, col):
    """Rectangle lying on a +x facing wall at xf."""
    return poly([P(xf, y1, z1), P(xf, y1, z2), P(xf, y2, z2), P(xf, y2, z1)], col)

def ground_quad(x0, z0, x1, z1, col, cls=None, y=0.0):
    return poly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], col, cls)

def pyramid(cx, cz, hw, hd, ybase, rh, col):
    """Pyramid roof: visible +z and +x triangular faces."""
    apex = P(cx, ybase + rh, cz)
    out = []
    # +z face (left)
    out.append(poly([P(cx - hw, ybase, cz + hd), P(cx + hw, ybase, cz + hd), apex], shade(col, 0.9)))
    # +x face (right)
    out.append(poly([P(cx + hw, ybase, cz - hd), P(cx + hw, ybase, cz + hd), apex], shade(col, 0.74)))
    return "".join(out)

def pyramid_y(cx, cz, hw, hd, ybase, rh, x, z):
    return ybase + rh * (1 - max(abs(x - cx) / hw, abs(z - cz) / hd))

# ---------------------------------------------------------------- buildings
GLASS = "#b8cfdc"
DOOR = "#8b7355"
STONE = "#eae6dd"
DARK = "#3a4651"

def cottage(x, z, wall, roof):
    w, h, d = 3.0, 2.3, 3.0
    x0, z0 = x - w / 2, z - d / 2
    out = [box(x0, 0, z0, w, h, d, wall)]
    # windows + door on the front (+z) face, one window on the +x face
    zf = z0 + d
    out.append(rect_z(x0 + 0.45, 1.15, x0 + 0.95, 1.65, zf, GLASS))
    out.append(rect_z(x0 + 2.05, 1.15, x0 + 2.55, 1.65, zf, GLASS))
    out.append(rect_z(x0 + 1.22, 0.0, x0 + 1.78, 1.15, zf, DOOR))
    out.append(rect_x(z0 + 1.2, 1.15, z0 + 1.8, 1.65, x0 + w, shade(GLASS, 0.85)))
    # roof with overhang
    ov = 0.35
    rh = 1.4
    out.append(pyramid(x, z, w / 2 + ov, d / 2 + ov, h, rh, roof))
    # chimney
    cx, cz = x + 0.55, z - 0.4
    ry = pyramid_y(x, z, w / 2 + ov, d / 2 + ov, h, rh, cx, cz)
    out.append(box(cx - 0.16, ry - 0.2, cz - 0.16, 0.32, (h + rh + 0.45) - (ry - 0.2), 0.32, STONE))
    # front step
    out.append(box(x - 0.5, 0, zf, 1.0, 0.12, 0.4, STONE))
    return "".join(out)

def cottage_l(x, z, wall, roof):
    mw, mh, md = 3.2, 2.3, 2.6
    ew, eh, ed = 1.8, 1.9, 2.2
    x0, z0 = x - mw / 2, z - md / 2
    ex0 = x0 - ew + 0.05
    ez0 = z0 + md - ed
    out = []
    # extension (behind/left) first, then main
    out.append(box(ex0, 0, ez0, ew, eh, ed, wall))
    out.append(rect_z(ex0 + 0.7, 0.9, ex0 + 1.1, 1.3, ez0 + ed, GLASS))
    out.append(pyramid(ex0 + ew / 2, ez0 + ed / 2, ew / 2 + 0.3, ed / 2 + 0.3, eh, 0.85, roof))
    out.append(box(x0, 0, z0, mw, mh, md, wall))
    zf = z0 + md
    out.append(rect_z(x0 + 0.5, 1.15, x0 + 1.05, 1.7, zf, GLASS))
    out.append(rect_z(x0 + 2.4, 1.2, x0 + 2.85, 1.65, zf, GLASS))
    out.append(rect_z(x0 + 1.55, 0.0, x0 + 2.15, 1.15, zf, DOOR))
    out.append(rect_x(z0 + 0.9, 1.15, z0 + 1.5, 1.7, x0 + mw, shade(GLASS, 0.85)))
    ov = 0.35
    rh = 1.25
    out.append(pyramid(x, z, mw / 2 + ov, md / 2 + ov, mh, rh, roof))
    cx, cz = x + 0.5, z - 0.4
    ry = pyramid_y(x, z, mw / 2 + ov, md / 2 + ov, mh, rh, cx, cz)
    out.append(box(cx - 0.15, ry - 0.2, cz - 0.15, 0.3, (mh + rh + 0.45) - (ry - 0.2), 0.3, STONE))
    out.append(box(x0 + 1.35, 0, zf, 1.0, 0.12, 0.4, STONE))
    return "".join(out)

def hsg(x, z, wall, glass):
    vols = [
        (5.5, 1.7, 4.4, 0.0, 0.3),
        (4.3, 1.4, 3.6, -0.5, -0.4),
        (3.2, 1.2, 2.8, 0.6, 0.4),
        (2.2, 1.0, 2.0, -0.2, -0.1),
    ]
    out = []
    y = 0.0
    for i, (w, h, d, ox, oz) in enumerate(vols):
        gh = h * 0.82
        cx, cz = x + ox, z + oz
        if i > 0:
            out.append(box(cx - w / 2 - 0.09, y, cz - d / 2 - 0.09, w + 0.18, 0.08, d + 0.18, wall))
        out.append(box(cx - w / 2, y, cz - d / 2, w, gh, d, glass, shades=(1.0, 0.9, 0.78)))
        # mullion line at mid height on both visible faces
        out.append(rect_z(cx - w / 2, y + gh / 2 - 0.02, cx + w / 2, y + gh / 2 + 0.02, cz + d / 2, wall))
        out.append(rect_x(cz - d / 2, y + gh / 2 - 0.02, cz + d / 2, y + gh / 2 + 0.02, cx + w / 2, wall))
        out.append(box(cx - w / 2 - 0.1, y + gh, cz - d / 2 - 0.1, w + 0.2, h - gh, d + 0.2, wall))
        y += h
    # entrance: dark doors + canopy on the front of the ground floor
    w0, h0, d0, ox0, oz0 = vols[0]
    zf = z + oz0 + d0 / 2
    out.append(rect_z(x + ox0 - 0.7, 0, x + ox0 + 0.7, 1.0, zf, DARK))
    out.append(box(x + ox0 - 0.9, 1.15, zf, 1.8, 0.08, 0.9, wall))
    return "".join(out)

def microsoft(x, z, fin, tint, parapet):
    w, d, fh = 4.8, 3.4, 1.3
    x0, z0 = x - w / 2, z - d / 2
    out = []
    # side wing on the -x side (drawn first, it is behind)
    ww, wh, wd = 1.8, 1.3, 2.8
    wx0 = x0 - ww + 0.05
    wz0 = z - wd / 2
    out.append(box(wx0 - 0.1, 0, wz0 - 0.1, ww + 0.2, 0.25, wd + 0.2, fin))
    out.append(box(wx0, 0.25, wz0, ww, wh * 0.85, wd, tint, shades=(1.0, 0.9, 0.78)))
    out.append(box(wx0 - 0.1, 0.25 + wh * 0.85, wz0 - 0.1, ww + 0.2, wh * 0.15, wd + 0.2, fin))
    # main block
    out.append(box(x0 - 0.15, 0, z0 - 0.15, w + 0.3, 0.3, d + 0.3, fin))
    y = 0.3
    floors = [(w, d), (w, d), (w * 0.7, d * 0.82)]
    for fw, fd in floors:
        gh, fnh = fh * 0.78, fh * 0.22
        out.append(box(x - fw / 2, y, z - fd / 2, fw, gh, fd, tint, shades=(1.0, 0.9, 0.78)))
        out.append(box(x - fw / 2 - 0.1, y + gh, z - fd / 2 - 0.1, fw + 0.2, fnh, fd + 0.2, fin))
        if fw == w:  # logo on the middle floor front
            pass
        y += fh
    tw, td = floors[2]
    out.append(box(x - tw / 2 - 0.125, y, z - td / 2 - 0.125, tw + 0.25, 0.15, td + 0.25, parapet))
    # Microsoft logo tiles on the front (+z) face of the middle floor
    zf = z0 + d
    ts, gap = 0.34, 0.05
    lx0 = x - ts - gap / 2
    ly0 = 0.3 + fh + 0.3
    cols = ["#f25022", "#7fba00", "#00a4ef", "#ffb900"]
    for i, (ix, iy) in enumerate([(0, 1), (1, 1), (0, 0), (1, 0)]):
        X = lx0 + ix * (ts + gap)
        Y = ly0 + iy * (ts + gap)
        out.append(rect_z(X, Y, X + ts, Y + ts, zf, cols[i]))
    # entrance overhang + doors
    out.append(rect_z(x - 0.9, 0.3, x + 0.9, 1.2, zf, shade(tint, 0.8)))
    out.append(box(x - 1.2, 1.2, zf, 2.4, 0.12, 0.8, fin))
    return "".join(out)

def stacked(x, z, wall, accent):
    out = []
    out.append(box(x - 1.6, 0, z - 1.6, 3.2, 2.2, 3.2, wall))
    out.append(rect_z(x - 1.2, 0.5, x + 0.6, 1.8, z + 1.6, GLASS))
    out.append(rect_z(x + 0.85, 0.0, x + 1.4, 1.2, z + 1.6, "#e08c3c"))
    # teal cube offset front-left, yellow cube back-right (drawn in isometric order)
    out.append(box(x - 0.4 - 1.2, 2.2, z + 0.4 - 1.2, 2.4, 1.8, 2.4, "#4fa8a0"))
    out.append(box(x + 0.95 - 0.65, 2.2, z - 0.6 - 0.65, 1.3, 1.3, 1.3, accent))
    # skylight on the teal cube
    sx, sz = x - 0.4, z + 0.4
    out.append(poly([P(sx - 0.6, 4.0, sz - 0.6), P(sx + 0.6, 4.0, sz - 0.6),
                     P(sx + 0.6, 4.0, sz + 0.6), P(sx - 0.6, 4.0, sz + 0.6)], GLASS))
    return "".join(out)

def badminton(x, z, wall, roof):
    w, h, d = 3.2, 2.4, 3.2
    x0, z0 = x - w / 2, z - d / 2
    out = []
    # garage on the -x side (behind)
    gw, gh, gd = 1.6, 1.7, 2.4
    gx0 = x0 - gw + 0.05
    gz0 = z - gd / 2
    out.append(box(gx0, 0, gz0, gw, gh, gd, wall))
    out.append(rect_z(gx0 + 0.2, 0, gx0 + 1.4, 1.2, gz0 + gd, "#e8e2d3"))
    out.append(box(gx0 - 0.12, gh, gz0 - 0.12, gw + 0.25, 0.12, gd + 0.25, roof))
    # main house
    out.append(box(x0, 0, z0, w, h, d, wall))
    zf = z0 + d
    out.append(rect_z(x0 + 0.5, 1.2, x0 + 1.05, 1.75, zf, GLASS))
    out.append(rect_z(x0 + 2.4, 1.2, x0 + 2.95, 1.75, zf, GLASS))
    out.append(rect_z(x0 + 1.72, 0.0, x0 + 2.28, 1.2, zf, DOOR))
    out.append(rect_x(z0 + 1.3, 1.2, z0 + 1.9, 1.75, x0 + w, shade(GLASS, 0.85)))
    ov = 0.35
    out.append(pyramid(x, z, w / 2 + ov, d / 2 + ov, h, 1.5, roof))
    out.append(box(x0 + 1.5, 0, zf, 0.9, 0.12, 0.4, STONE))
    # racket lying on the lawn east of the house (ground plane, isometric transform)
    rx, rz = x + 2.5, z - 0.5
    a, b, c, dd, e, f = K, K / 2, -K, K / 2, 0, 0
    ex, ey = P(rx, 0.02, rz)
    out.append(
        f'<g transform="matrix({a},{b},{c},{dd},{ex:.1f},{ey:.1f}) rotate(-25)">'
        f'<line x1="0" y1="0.05" x2="0" y2="1.05" stroke="#2b2b2b" stroke-width="0.14" stroke-linecap="round"/>'
        f'<ellipse cx="0" cy="1.5" rx="0.42" ry="0.5" fill="#f7f7f2" stroke="#d23440" stroke-width="0.09"/>'
        f'<path d="M-0.3,1.5 H0.3 M-0.2,1.25 H0.2 M-0.2,1.75 H0.2 M0,1.05 V1.95 M-0.18,1.1 V1.9 M0.18,1.1 V1.9" stroke="#cfcfc9" stroke-width="0.03" fill="none"/>'
        f'</g>'
    )
    return "".join(out)

def tree(x, z):
    trunk = box(x - 0.12, 0, z - 0.12, 0.24, 0.8, 0.24, "var(--c-trunk)", shades=(1.0, 0.85, 0.7))
    cx, cy = P(x, 1.35, z)
    canopy = (f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{0.72 * K:.1f}" fill="var(--c-leaf)"/>'
              f'<circle cx="{cx - 0.2 * K:.1f}" cy="{cy - 0.2 * K:.1f}" r="{0.36 * K:.1f}" fill="var(--c-leaf-hi)"/>')
    return trunk + canopy

def traffic_light(x, z):
    metal = "#2c3036"
    out = [box(x - 0.15, 0, z - 0.15, 0.3, 0.1, 0.3, metal)]
    out.append(box(x - 0.06, 0.1, z - 0.06, 0.12, 2.2, 0.12, metal, shades=(1.0, 0.9, 0.75)))
    out.append(box(x - 0.15, 2.25, z - 0.12, 0.3, 0.85, 0.24, metal))
    for col, off in (("#ff3636", 0.26), ("#ffcc44", 0.0), ("#4cdb5c", -0.26)):
        lx, ly = P(x + 0.15, 2.675 + off, z)
        out.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="{0.1 * K:.1f}" fill="{col}"/>')
    return "".join(out)

def car(x, z, colour, east=True):
    out = []
    # wheels
    for wx, wz in ((x + 0.55, z + 0.4), (x + 0.55, z - 0.4), (x - 0.55, z + 0.4), (x - 0.55, z - 0.4)):
        out.append(box(wx - 0.18, 0, wz - 0.06, 0.36, 0.34, 0.12, "#1a1a1a", shades=(0.9, 0.7, 0.55)))
    out.append(box(x - 0.85, 0.15, z - 0.4, 1.7, 0.35, 0.8, colour))
    out.append(box(x - 0.55, 0.5, z - 0.36, 0.95, 0.32, 0.72, "#2a3540"))
    out.append(rect_x(z - 0.34, 0.55, z + 0.34, 0.79, x + 0.4, GLASS))       # windshield
    out.append(rect_z(x - 0.55, 0.55, x + 0.4, 0.79, z + 0.36, shade(GLASS, 0.85)))  # side glass
    lamp = "#ffe9a8" if east else "#e0342c"
    out.append(rect_x(z - 0.36, 0.28, z - 0.2, 0.4, x + 0.85, lamp))
    out.append(rect_x(z + 0.2, 0.28, z + 0.36, 0.4, x + 0.85, lamp))
    return "".join(out)

# ---------------------------------------------------------------- scene
def dashed_line(length, x, z, axis):
    dash, gap = 1.0, 0.7
    step = dash + gap
    n = max(1, int((length - gap) // step))
    total = n * dash + (n - 1) * gap
    start = -total / 2 + dash / 2
    t = 0.12
    out = []
    for i in range(n):
        off = start + i * step
        if axis == "x":
            out.append(ground_quad(x + off - dash / 2, z - t / 2, x + off + dash / 2, z + t / 2, "var(--c-line)"))
        else:
            out.append(ground_quad(x - t / 2, z + off - dash / 2, x + t / 2, z + off + dash / 2, "var(--c-line)"))
    return "".join(out)

def crosswalk(cx, cz, axis, span):
    sw, gap, n = 0.34, 0.24, 3
    total = n * sw + (n - 1) * gap
    start = -total / 2 + sw / 2
    out = []
    for i in range(n):
        off = start + i * sw + i * gap
        if axis == "x":
            out.append(ground_quad(cx + off - sw / 2, cz - span / 2, cx + off + sw / 2, cz + span / 2, "var(--c-line)"))
        else:
            out.append(ground_quad(cx - span / 2, cz + off - sw / 2, cx + span / 2, cz + off + sw / 2, "var(--c-line)"))
    return "".join(out)

GX0, GX1, GZ0, GZ1 = -16.5, 16.5, -14.5, 14.5
SLAB = 0.7

def ground():
    out = []
    # slab sides (thickness) then top
    out.append(poly([P(GX0, 0, GZ1), P(GX1, 0, GZ1), P(GX1, -SLAB, GZ1), P(GX0, -SLAB, GZ1)], "var(--c-slab-l)"))
    out.append(poly([P(GX1, 0, GZ0), P(GX1, 0, GZ1), P(GX1, -SLAB, GZ1), P(GX1, -SLAB, GZ0)], "var(--c-slab-r)"))
    out.append(ground_quad(GX0, GZ0, GX1, GZ1, "var(--c-ground)"))
    return "".join(out)

def roads():
    nsW, nsE = -5.75, 4.3
    out = []
    # sidewalk under the main road, then asphalt
    out.append(ground_quad(-16.4, -1.4, 16.4, 1.4, "var(--c-curb)"))
    out.append(ground_quad(-16, -1, 16, 1, "var(--c-road)"))
    out.append(ground_quad(-15, -10.6, 15, -9.4, "var(--c-road)"))
    out.append(ground_quad(-15, 9.4, 15, 10.6, "var(--c-road)"))
    out.append(ground_quad(nsW - 0.9, -11, nsW + 0.9, 11, "var(--c-road)"))
    out.append(ground_quad(nsE - 0.9, -11, nsE + 0.9, 11, "var(--c-road)"))
    out.append(dashed_line(7.2, -12.35, 0, "x"))
    out.append(dashed_line(4.0, -0.72, 0, "x"))
    out.append(dashed_line(8.6, 11.62, 0, "x"))
    for nx in (nsW, nsE):
        out.append(dashed_line(6.4, nx, -6.72, "z"))
        out.append(dashed_line(6.4, nx, 6.72, "z"))
        out.append(crosswalk(nx - 2.2, 0, "x", 2))
        out.append(crosswalk(nx + 2.2, 0, "x", 2))
        out.append(crosswalk(nx, -2.7, "z", 1.8))
        out.append(crosswalk(nx, 2.7, "z", 1.8))
    return "".join(out)

BUILDINGS = [
    # id, label, href, x, z, factory, top-y (for label)
    ("about",     "About Me",       "#about",      -10, -5.2, lambda x, z: cottage(x, z, "#f5e4c8", "#d27654"), 4.0),
    ("hsg",       "University",     "#education",    0, -5.6, lambda x, z: hsg(x, z, "#f8f7f2", "#aac4d4"), 5.6),
    ("microsoft", "Microsoft",      "#microsoft",   10, -5.2, lambda x, z: microsoft(x, z, "#ffffff", "#9ec1d3", "#e8e8e8"), 4.5),
    ("coding",    "Coding Project", "#coding",     -10,  5.2, lambda x, z: stacked(x, z, "#faf7f0", "#f3c969"), 4.3),
    ("badminton", "Badminton",      "#badminton",    0,  5.6, lambda x, z: badminton(x, z, "#f3d5b8", "#c85a47"), 4.2),
    ("contact",   "Contact",        "#contact",     10,  5.2, lambda x, z: cottage_l(x, z, "#d8e5ca", "#db9088"), 3.9),
]

TREES = [(-14, -12), (-14, -7), (-14, -3), (-14, 3), (-14, 7), (-14, 12),
         (14, -12), (14, -7), (14, -3), (14, 3), (14, 7), (14, 12),
         (-8, -13), (-4, -13), (0, -13), (4, -13), (8, -13),
         (-8, 13), (-4, 13), (0, 13), (4, 13), (8, 13)]

def building_markup(bid, label, href, x, z, factory, topy):
    lx, ly = P(x, topy + 0.9, z)
    tw = len(label) * 7.6 + 26
    return (
        f'<a href="{href}" class="city-link" data-building="{bid}" aria-label="{label} — jump to section">'
        f'<title>{label}</title>'
        f'<g class="bld">{factory(x, z)}</g>'
        f'<g class="lbl" aria-hidden="true">'
        f'<rect x="{lx - tw / 2:.1f}" y="{ly - 26:.1f}" width="{tw:.1f}" height="26" rx="13"/>'
        f'<text x="{lx:.1f}" y="{ly - 9:.1f}" text-anchor="middle">{label}</text>'
        f'</g></a>'
    )

def plot(x, z, w, d):
    return ground_quad(x - w / 2, z - d / 2, x + w / 2, z + d / 2, "var(--c-plot)")

def build():
    objs = []  # (sortkey, markup)
    for bid, label, href, x, z, fac, topy in BUILDINGS:
        objs.append((x - 3 + z - 3, z, building_markup(bid, label, href, x, z, fac, topy)))
    for x, z in TREES:
        objs.append((x + z, z, tree(x, z)))
    objs.append((-4.7 - 1.3, -1.3, traffic_light(-4.7, -1.3)))

    north = sorted([o for o in objs if o[1] < 0], key=lambda o: o[0])
    south = sorted([o for o in objs if o[1] >= 0], key=lambda o: o[0])

    plots = "".join(plot(x, z, 7.6, 6.2) for _, _, _, x, z, _, _ in BUILDINGS)

    # cars: drawn at a resting position on the road; CSS animates them along x
    cars = (
        '<g class="cars" clip-path="url(#city-clip)">'
        f'<g class="car car-east">{car(-10.5, -0.5, "#d93838", True)}</g>'
        f'<g class="car car-west">{car(8, 0.5, "#2c6fd0", False)}</g>'
        '</g>'
    )

    # viewBox from ground slab bounds + headroom for tallest building
    xs = [P(GX0, 0, GZ0)[0], P(GX1, 0, GZ1)[0], P(GX0, 0, GZ1)[0], P(GX1, 0, GZ0)[0]]
    ys = [P(GX0, 0, GZ0)[1], P(GX1, -SLAB, GZ1)[1]]
    minx, maxx = min(xs) - 8, max(xs) + 8
    miny, maxy = min(ys) - 0.5 * K, max(ys) + 8
    vb = f"{minx:.0f} {miny:.0f} {maxx - minx:.0f} {maxy - miny:.0f}"

    clip = (f'<clipPath id="city-clip"><polygon points="{fmt([P(GX0, 0, GZ0), P(GX1, 0, GZ0), P(GX1, 0, GZ1), P(GX0, 0, GZ1)])}"/></clipPath>')

    svg = (
        f'<svg class="city" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" role="group" aria-labelledby="city-title" focusable="false">'
        f'<title id="city-title">Map of Philip\'s town: each building links to a section of this page</title>'
        f'<defs>{clip}</defs>'
        f'<g class="city-ground">{ground()}{plots}{roads()}</g>'
        f'<g class="city-north">{"".join(m for _, _, m in north)}</g>'
        f'{cars}'
        f'<g class="city-south">{"".join(m for _, _, m in south)}</g>'
        f'</svg>'
    )
    return svg

if __name__ == "__main__":
    import sys
    out = build()
    sys.stdout.write(out)
    sys.stderr.write(f"\n{len(out)} bytes\n")
