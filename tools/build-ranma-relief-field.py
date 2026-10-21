"""Convert the declared sculpting guide to scalar mesh inputs, never scene RGB."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[1]
asset = root / "assets/ranma-relief-v01"
guide = asset / "generated-height-guide.png"
crop = [290, 122, 1878, 564]
columns, rows = 257, 81
image = Image.open(guide).convert("L").crop(crop)
image = image.filter(ImageFilter.GaussianBlur(.55)).resize((columns, rows), Image.Resampling.LANCZOS)
data = {"columns": columns, "rows": rows, "height": list(image.getdata()), "cutoff": 35}
(asset / "height-field.json").write_text(json.dumps(data, separators=(",", ":")) + "\n")
report = {"sourceGuide": str(guide.relative_to(root)), "guideSha256": hashlib.sha256(guide.read_bytes()).hexdigest(), "crop": crop, "columns": columns, "rows": rows, "heightMeaning": "Non-metric scalar sculpting interpretation, not recovered depth", "sceneBitmapUse": False, "visibleAlbedoUse": False, "geometry": "Closed relief volumes with cut-out interstices, actual PBR lighting and scene shadows", "photographicAcceptance": False}
(asset / "build-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(asset / "height-field.json")
