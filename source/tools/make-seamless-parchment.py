"""Make the supplied parchment texture tile without visible seams.

    python3 tools/make-seamless-parchment.py
reads  src/assets/texture/page-parchment.webp       (supplied, left untouched)
writes src/assets/texture/page-parchment-tile.webp  (used by the stylesheet)

Method: classic edge cross-fade. The last B columns are faded into the first B
columns (then the same for rows), so the result repeats with period (w-B, h-B)
and has no seam. Requires Pillow and NumPy.
"""
from pathlib import Path

import numpy as np
from PIL import Image

B = 192
TEX = Path(__file__).resolve().parent.parent / "src" / "assets" / "texture"
img = np.asarray(Image.open(TEX / "page-parchment.webp").convert("RGB")).astype(np.float32)


def fade_axis(a, axis):
    a = np.moveaxis(a, axis, 0)
    n = a.shape[0]
    p = n - B
    out = a[:p].copy()
    t = (np.arange(B) / B)[:, None, None]
    t = t * t * (3 - 2 * t)
    # start of the tile = blend of the overflow tail (fading out) and the head (fading in)
    out[:B] = a[p:] * (1 - t) + a[:B] * t
    return np.moveaxis(out, 0, axis)


tile = fade_axis(fade_axis(img, 1), 0)
Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8)).save(
    TEX / "page-parchment-tile.webp", "WEBP", quality=86, method=6)
print("wrote", TEX / "page-parchment-tile.webp", tile.shape[1], "x", tile.shape[0])
