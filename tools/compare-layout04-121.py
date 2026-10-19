"""Labelled comparison of supplied reference and actual saved WebGL frames.

This only crops/resizes existing evidence for comparison. It never replaces a
rendered frame or edits scene imagery; originals remain next to the receipts.
"""
from pathlib import Path
import hashlib, json
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa/ten-reference/04/layout121'
paths=[ROOT/'references/hd/3-照片-4.jpg',ROOT/'qa/ten-reference/04/iteration-shadow104-triplet/shot--11040.png',ROOT/'qa/ten-reference/04/iteration-layout121-c/shot--11041.png']
labels=['SUPPLIED REFERENCE','BASELINE ACTUAL 3D','LAYOUT121-C ACTUAL 3D']
images=[Image.open(p).convert('RGB') for p in paths]
sheet=Image.new('RGB',(3*627,659),'#242424')
for i,(im,label)in enumerate(zip(images,labels)):
    sheet.paste(im.resize((627,627),Image.Resampling.LANCZOS),(i*627,32))
    ImageDraw.Draw(sheet).text((i*627+8,9),label,fill='white')
sheet.save(OUT/'comparison-reference-baseline-layout121.png')
roof=Image.new('RGB',(1200,390*3),'#242424')
for i,(im,label)in enumerate(zip(images,labels)):
    roof.paste(im.crop((260,110,1010,340)).resize((1200,368),Image.Resampling.LANCZOS),(0,i*390+22))
    ImageDraw.Draw(roof).text((8,i*390+4),label,fill='white')
roof.save(OUT/'roof-mass-comparison-c.png')
receipt={'scope':'Labelled comparison crops/resizes only; source photographs and actual frames are retained unchanged','referenceUse':'Comparison input, not a rendered surface','sources':[{'file':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'label':label} for p,label in zip(paths,labels)],'outputs':['comparison-reference-baseline-layout121.png','roof-mass-comparison-c.png'],'actualSourceCommit':json.loads((ROOT/'qa/ten-reference/04/iteration-layout121-c/report.json').read_text())['sourceCommit']}
(OUT/'comparison-provenance.json').write_text(json.dumps(receipt,indent=2)+'\n')
