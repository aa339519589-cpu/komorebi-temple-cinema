"""Compare the input photograph with actual first/last3D Gaussian frames."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

raw, output=Path(sys.argv[1]),Path(sys.argv[2])
rec=json.loads((raw/'report.json').read_text())
output.mkdir(parents=True,exist_ok=True)
shutil.copyfile(raw/'report.json',output/'report.json')
(output/'viewer.json').write_text(json.dumps(rec['metadata']['data'],indent=2,ensure_ascii=False)+'\n')
items=[(Path(rec['metadata']['data']['image']['path']),'INPUT PHOTO / comparison only')]
for frame in rec['frames']:
    p=frame['pose']
    items.append((raw/(frame['name']+'.png'),f"REAL3D / t{frame['time']:g} / +Z{p['translationCV'][2]:.4f}u / f{p['focalScale']:.2f}"))
tile,bar=627,36
sheet=Image.new('RGB',(tile*len(items),tile+bar),'#101610')
draw=ImageDraw.Draw(sheet)
try:font=ImageFont.truetype('/System/Library/Fonts/Menlo.ttc',14)
except OSError:font=ImageFont.load_default()
for j,(path,label) in enumerate(items):
    image=Image.open(path).convert('RGB').resize((tile,tile),Image.Resampling.LANCZOS)
    sheet.paste(image,(j*tile,bar))
    draw.text((j*tile+9,10),label,font=font,fill='#e7eadf')
sheet.save(output/'comparison.png',optimize=True)
