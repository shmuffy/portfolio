"""
One-off: turn a colour Altium board render into "etched line-work" — ink marks
on a transparent ground, so it composites onto the site's bone paper.

  python scripts/pcb_etch.py reference/bms-board-color.png       reference/ pcb-bms
  python scripts/pcb_etch.py reference/eload-board-color.png     reference/ pcb-eload
  python scripts/pcb_etch.py reference/sensorhub-board-color.png reference/ pcb-sensorhub

Writes <prefix>-A.png ... <prefix>-D.png (candidates) to the out dir.
Not part of the build; throwaway.

Idea: the board's *base plane* — the single dominant colour: a gold substrate, a
flood copper pour, or a dark soldermask — plus the neutral editor-margin grey are
treated as background → transparent, but their *boundaries* are drawn. Everything
else (routing, silkscreen, components, pads, easter eggs) is a "feature": big flat
features get a thick outline (morphological gradient with a fat structuring
element); thin features (traces!) survive whole. A high-pass / find-edges layer
adds the fine stuff (text strokes, trace edges within a pour).
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = sys.argv[2].rstrip("/\\")
PREFIX = sys.argv[3] if len(sys.argv) > 3 else "pcb-bms"
INK = (26, 25, 22)  # #1a1916


def L(a):
    return Image.fromarray(np.clip(a * 255.0, 0, 255).astype(np.uint8), "L")


def arr_of(img):
    return np.asarray(img).astype(np.float32) / 255.0


def gauss(a, r):
    return arr_of(L(a).filter(ImageFilter.GaussianBlur(r)))


def maxf(a, k):
    return arr_of(L(a).filter(ImageFilter.MaxFilter(k)))


def minf(a, k):
    return arr_of(L(a).filter(ImageFilter.MinFilter(k)))


im = Image.open(SRC).convert("RGB")
rgb = np.asarray(im).astype(np.float32)
H, Wd = rgb.shape[:2]
gray = rgb.mean(axis=2)
sat = rgb.max(axis=2) - rgb.min(axis=2)

# --- the editor canvas + board shape -----------------------------------------
# the canvas is a large, fairly-bright, near-neutral region. A morphological open
# (erode hard, dilate back) kills small near-neutral specks like bare pads so they
# don't punch holes in the board mask. The board = everything that isn't canvas;
# its outer contour, thickened a touch, is the edge line.
_nn = ((gray > 130) & (sat < 25)).astype(np.float32)
_canvas = (maxf(minf(_nn, 17), 17) > 0.5)
_board = (~_canvas).astype(np.float32)
board_outline = (_board - minf(_board, 7) > 0.25).astype(np.float32)
board_outline = (maxf(board_outline, 3) > 0.25).astype(np.float32)

# --- base plane: the dominant colour of the *board* (canvas excluded) --------
# a gold substrate, a flood copper pour, or a dark soldermask — whatever the board
# is mostly made of. Quantise coarsely, take the mode over non-canvas pixels.
_chroma = rgb[~_canvas]
codes, counts = np.unique((_chroma[::3] // 16).astype(int), axis=0, return_counts=True)
bg = codes[np.argmax(counts)] * 16.0 + 8.0
print("base plane ~", bg.astype(int).tolist(), "(sat %.0f)" % (bg.max() - bg.min()))

dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
feat = np.clip(dist / 130.0, 0, 1)
# anything desaturated is background, whatever its lightness: the grey editor
# margin, a black/white soldermask, a grey off-layer plane. Saturated stuff
# (copper, silk, pads, easter eggs) is a feature. The mode-distance above carves
# out a *coloured* base plane (gold substrate / red copper flood).
feat = np.where(sat < 25, 0.0, feat)
feat_s = gauss(feat, 1.0)

hp = gray - gauss(gray / 255.0, 2.4) * 255.0
hp_mag = np.abs(hp)
fe = arr_of(Image.fromarray(gray.astype(np.uint8)).filter(ImageFilter.FIND_EDGES))


def candidate(name, feat_thr, erode, hp_thr, fe_thr, soft, fill_alpha=0.0):
    mask = (feat_s > feat_thr).astype(np.float32)
    # morphological gradient with a fat structuring element: big flat regions get
    # a ~(erode//2)px outline; thin features (traces) survive whole
    shape = np.clip(mask - minf(mask, erode), 0, 1)
    shape = (shape > 0.25).astype(np.float32)

    detail = np.maximum(
        (hp_mag > hp_thr).astype(np.float32),
        (fe > fe_thr).astype(np.float32),
    ) * (feat_s > 0.15).astype(np.float32)
    # kill lone speckles without eroding 1px lines (blur a hair, re-threshold)
    detail = (gauss(detail, 0.6) > 0.32).astype(np.float32)

    ink = np.maximum(np.maximum(shape, detail), board_outline)
    if soft:
        ink = gauss(ink, soft)
    a = np.clip(ink, 0, 1)
    if fill_alpha > 0:
        a = np.clip(a + gauss(mask, 0.6) * fill_alpha, 0, 1)

    out = np.zeros((H, Wd, 4), np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = INK
    out[..., 3] = np.clip(a * 255.0, 0, 255).astype(np.uint8)
    p = f"{OUT}/{PREFIX}-{name}.png"
    Image.fromarray(out, "RGBA").save(p, optimize=True)
    print("wrote", p, "ink-coverage %.1f%%" % (100 * (a > 0.05).mean()))


# A — balanced etched line drawing
candidate("A", feat_thr=0.40, erode=7, hp_thr=15, fe_thr=42, soft=0.6)
# B — lighter / cleaner
candidate("B", feat_thr=0.46, erode=5, hp_thr=22, fe_thr=56, soft=0.5)
# C — denser / heavier ink, thicker outlines
candidate("C", feat_thr=0.34, erode=9, hp_thr=11, fe_thr=32, soft=0.7)
# D — A + a faint screened fill so flat regions still read as solid
candidate("D", feat_thr=0.40, erode=7, hp_thr=15, fe_thr=42, soft=0.6, fill_alpha=0.18)
