"""Arrange actual captured3D frames without painting over their image areas."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, shutil, hashlib, os

ROOT=Path(__file__).resolve().parent.parent
iteration=os.environ.get('FILM_ITERATION','depth-field-film-v02')
OUT=ROOT/'output'/iteration
PUBLIC=ROOT/'qa'/iteration;PUBLIC.mkdir(parents=True,exist_ok=True)
scenes=json.loads((ROOT/'reconstructions/depth-field/scenes.json').read_text())['scenes']
thumb=360;bar=34
sheet=Image.new('RGB',(thumb*3,(thumb+bar)*10),'#10120f');draw=ImageDraw.Draw(sheet)
try:font=ImageFont.truetype('/System/Library/Fonts/PingFang.ttc',18)
except OSError:font=ImageFont.load_default()
for row,scene in enumerate(scenes):
    ident=f"{scene['reference']:02d}"
    for col,frame in enumerate([0,105,209]):
        im=Image.open(OUT/'shots'/ident/f'frame-{frame:04d}.png').convert('RGB')
        x=col*thumb;y=row*(thumb+bar)
        draw.text((x+8,y+6),f"{ident} {scene['name']} · {['近景','中段','参考机位'][col]}",font=font,fill='#dfc98e')
        sheet.paste(im.resize((thumb,thumb),Image.Resampling.LANCZOS),(x,y+bar))
for folder in [PUBLIC,OUT]:sheet.save(folder/'ten-shots-actual-frames.jpg',quality=94,subsampling=0)
for name in ['film-build.json','model-archive.json']:shutil.copyfile(OUT/name,PUBLIC/name)
assets=[]
for name in ['temple-ten-scenes-60s.mp4','temple-ten-scenes-70s.mp4','ten-depth-field-models-v02.zip','ten-shots-actual-frames.jpg','source-shots-and-receipts.zip']:
    path=OUT/name
    if not path.exists():continue
    digest=hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda:stream.read(8388608),b''):digest.update(chunk)
    assets.append({'name':name,'bytes':path.stat().st_size,'sha256':digest.hexdigest()})
metadata={'tag':'depth-field-film-2026-10-18-v02','rendering':'Actual Three/Spark rasterization of independently estimated depth surfaces; ApacheSmall only.','allTenScenes':True,'video':{'width':1080,'height':1080,'fps':30,'minuteFrames':1800,'fullFrames':2100,'sourceShotSeconds':7},'completeClosedCad':False,'completeRequestedFidelity':False,'assets':assets}
for folder in [PUBLIC,OUT]:(folder/'assets.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(metadata,ensure_ascii=False))
