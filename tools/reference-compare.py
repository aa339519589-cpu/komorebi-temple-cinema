"""Make factual left-reference/right-render comparison sheets, never retouching.
Usage: python tools/reference-compare.py REFERENCE RENDER OUTPUT --note TEXT
The render remains at native size by default. A JSON sidecar records hashes.
"""
import argparse, hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p=argparse.ArgumentParser();p.add_argument('reference');p.add_argument('render');p.add_argument('output');p.add_argument('--note',default='Work in progress. Camera and geometry require comparison.');p.add_argument('--title',default='参考目标 / 实际渲染');p.add_argument('--size',type=int);a=p.parse_args()
ref=Image.open(a.reference).convert('RGB');render=Image.open(a.render).convert('RGB');size=a.size or render.width
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
try:font=ImageFont.truetype(fontpath,24);small=ImageFont.truetype(fontpath,19)
except OSError:font=small=ImageFont.load_default()
canvas=Image.new('RGB',(size*2+40,size+125),'#17191d');draw=ImageDraw.Draw(canvas)
for im,x in [(ref,10),(render,size+30)]:
    fitted=im.copy();fitted.thumbnail((size,size),Image.Resampling.LANCZOS)
    canvas.paste(fitted,(x+(size-fitted.width)//2,50+(size-fitted.height)//2))
draw.text((10,10),'参考图 · 复原目标',font=font,fill='white');draw.text((size+30,10),'实际渲染 · 尚未达标',font=font,fill='white')
draw.text((10,size+67),a.note,font=small,fill='#e6c080')
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);canvas.save(out)
def source(path,im):return {'filename':Path(path).name,'sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),'nativeSize':list(im.size)}
json.dump({'reference':source(a.reference,ref),'render':source(a.render,render),'comparisonOnly':True,'renderRetouched':False,'displaySquare':size,'note':a.note},open(str(out)+'.json','w'),ensure_ascii=False,indent=2)
