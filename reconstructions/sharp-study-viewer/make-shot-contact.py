"""Arrange30 actual Gaussian dolly frames; all raw native PNGs stay untouched."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

studies, review = Path(sys.argv[1]), Path(sys.argv[2])
iteration = sys.argv[3] if len(sys.argv)>3 else "shotplan01"
review.mkdir(parents=True, exist_ok=True)
tile, bar, scene_bar = 384, 25, 24
master=Image.new("RGB",(tile*3,(tile+bar+scene_bar)*10),"#111610")
try:
    font=ImageFont.truetype("/System/Library/Fonts/Menlo.ttc",13)
except OSError:
    font=ImageFont.load_default()
summary={"kind":"30 actual3D Gaussian shot-planning frames", "visualAccepted":False,"iteration":iteration,"filmRendered":False,"sourceImageOverlay":False,"scenes":[]}
for index in range(10):
    scene=f"{index+1:02d}"
    raw=studies/scene/("viewer-"+iteration)
    rec=json.loads((raw/"report.json").read_text())
    dest=review/scene
    dest.mkdir(exist_ok=True)
    shutil.copyfile(raw/"report.json",dest/"report.json")
    (dest/"viewer.json").write_text(json.dumps(rec["metadata"]["data"],indent=2,ensure_ascii=False)+"\n")
    row=Image.new("RGB",(627*3,627+32+28),"#111610")
    row_draw=ImageDraw.Draw(row)
    plan=rec["frames"][0]["info"]["shotPlan"]
    label=f"{scene} / real dolly {plan['travel']:.4f}m / focal {plan['focalScaleStart']:.2f} -> 1.00 / end source camera"
    row_draw.text((10,6),label,font=font,fill="#d2dec5")
    y=index*(tile+bar+scene_bar)
    ImageDraw.Draw(master).text((10,y+5),label,font=font,fill="#d2dec5")
    frames=[]
    for j,frame in enumerate(rec["frames"]):
        name=frame["name"]
        image=Image.open(raw/(name+".png")).convert("RGB")
        caption=f"t={frame['time']:g}s / +Z {frame['pose']['translationCV'][2]:.4f}m / f {frame['pose']['focalScale']:.3f}"
        row_draw.text((j*627+10,28+8),caption,font=font,fill="#e7ebdf")
        row.paste(image.resize((627,627),Image.Resampling.LANCZOS),(j*627,28+32))
        ImageDraw.Draw(master).text((j*tile+8,y+scene_bar+6),caption,font=font,fill="#e7ebdf")
        master.paste(image.resize((tile,tile),Image.Resampling.LANCZOS),(j*tile,y+scene_bar+bar))
        frames.append({"name":name,"time":frame["time"],"file":str(raw/(name+".png")),"translationCV":frame["pose"]["translationCV"],"focalScale":frame["pose"]["focalScale"],"rgbaSha256":frame["rgbaSha256"]})
    row.save(dest/"comparison.png",optimize=True)
    summary["scenes"].append({"scene":scene,"model":rec["model"],"metadata":rec["metadata"]["sha256"],"rendererSourceHash":rec["rendererSourceHash"],"shotPlan":plan,"frames":frames})
master.save(review/"contact-sheet-30.png",optimize=True)
(review/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
