"""CPU-only evidence crops/statistics. Never loaded by the reconstructed scene."""
from pathlib import Path
import json
import numpy as np
import OpenImageIO as oiio

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
REFERENCE_ROOT = Path("/Users/mima1234/temple-cinema-live-sync")
inputs = [
    ("original", REFERENCE_ROOT / "references/hd/8-照片-9.jpg", (315,71,343,151)),
    ("native103b", REFERENCE_ROOT / "qa/ten-reference/09/iteration-paper103b/reference.png", (312,71,343,183)),
    ("spire105", ROOT / "qa/ten-reference/09/iteration-spire105/reference.png", (312,88,343,169)),
    ("spire105b", ROOT / "qa/ten-reference/09/iteration-spire105b/reference.png", (312,86,343,169)),
]
panels, statistics = [], []
for name, path, bounds in inputs:
    source = oiio.ImageInput.open(str(path))
    pixels = source.read_image(format=oiio.UINT8)
    source.close()
    # Same image coordinates in all panels. No alignment warp or color changes.
    crop = pixels[0:220, 290:370, :3]
    panels.append(np.repeat(np.repeat(crop, 4, axis=0), 4, axis=1))
    x0,y0,x1,y1 = bounds
    rgb = pixels[y0:y1,x0:x1,:3].astype(float)
    warm = (rgb[:,:,0] > 65) & (rgb[:,:,0] > rgb[:,:,2]*1.4) & (rgb[:,:,0] > rgb[:,:,1]*1.05)
    selected = rgb[warm]
    statistics.append({
        "name": name, "path": str(path), "boundsXYXY": bounds,
        "selection": "R>65, R>1.4*B, R>1.05*G; descriptive warm visible pixels, not a fitted texture or acceptance score",
        "selectedPixels": len(selected),
        "encodedRGBQuantiles25_50_75": np.percentile(selected,[25,50,75],axis=0).tolist() if len(selected) else None,
    })
out = np.concatenate(panels, axis=1)
writer = oiio.ImageOutput.create(str(HERE / "comparison-original-103b-105-105b-spire.png"))
writer.open(str(HERE / "comparison-original-103b-105-105b-spire.png"), oiio.ImageSpec(out.shape[1],out.shape[0],3,oiio.UINT8))
writer.write_image(out)
writer.close()
(HERE / "image-statistics.json").write_text(json.dumps({
    "scope": "Comparison evidence only; no original-image data appears in source geometry, material, lighting or background",
    "panelOrder": [i[0] for i in inputs],
    "cropXYWH": [290,0,80,220], "displayScale": "nearest 4x CPU enlargement, not native detail",
    "statistics": statistics,
}, ensure_ascii=False, indent=2) + "\n")
