"""Extract actual encoded source frames for visual review; never paints scene pixels."""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

report_file = Path(sys.argv[1]).resolve()
report = json.loads(report_file.read_text())
out = report_file.parent / "motion-review"
out.mkdir(exist_ok=True)
size, gap, title = 288, 12, 38
board = Image.new("RGB", (3 * size + 4 * gap, len(report["shots"]) * (size + title) + gap), "#161916")
draw = ImageDraw.Draw(board)
records = []
for row, shot in enumerate(report["shots"]):
    fps = report["fps"]
    times = [0.5 / fps, 3.5, 7 - 0.5 / fps]
    for col, time in enumerate(times):
        frame = out / ("scene-%02d-%s.png" % (shot["reference"], ["start", "middle", "end"][col]))
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", str(time), "-i", shot["file"], "-frames:v", "1", "-update", "1", str(frame)], check=True)
        im = Image.open(frame).convert("RGB")
        im.thumbnail((size, size), Image.Resampling.LANCZOS)
        x, y = gap + col * (size + gap), gap + row * (size + title)
        draw.text((x, y + 7), "%02d / %.3fs / encoded 3D frame" % (shot["reference"], time), fill="#e7ca90")
        board.paste(im, (x, y + title))
        records.append({"reference": shot["reference"], "time": time, "frame": str(frame), "sourceHash": shot["source"]["hash"]})
board.save(out / "all-shots-start-middle-end.jpg", quality=93)
(out / "frames.json").write_text(json.dumps({"filmBuild": str(report_file), "visualAccepted": False, "frames": records}, indent=2) + "\n")
print(out / "all-shots-start-middle-end.jpg")
