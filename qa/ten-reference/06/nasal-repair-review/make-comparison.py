"""Comparison layout only. It never supplies pixels to modeling or rendering."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
try:font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',19)
except OSError:font=ImageFont.load_default()
photo=Image.open(ROOT/'references/hd/4-照片-5.jpg').convert('RGB').crop((584,331,679,426))
paths=[None,'iteration-learned86','iteration-nasal87','iteration-nasal88']
labels=['Reference photo: 95 x 95 crop enlarged for comparison','86 actual native subfrustum: curled openings (base)','87 actual native subfrustum: closed but spherical (rejected)','88 actual native subfrustum: lower, still lumpy (unaccepted)']
N=640;pad=12;header=42
canvas=Image.new('RGB',(N*2+pad*3,(N+header)*2+pad*3),(28,29,31));draw=ImageDraw.Draw(canvas)
for i,(path,label) in enumerate(zip(paths,labels)):
 im=photo if path is None else Image.open(ROOT/'qa/ten-reference/06'/path/'detail-native.png').convert('RGB')
 x=pad+(i%2)*(N+pad);y=pad+(i//2)*(N+header+pad)
 draw.text((x+4,y+9),label,font=font,fill=(235,235,235));canvas.paste(im.resize((N,N),Image.Resampling.LANCZOS),(x,y+header))
canvas.save(OUT/'comparison-photo86-87-88.png')
