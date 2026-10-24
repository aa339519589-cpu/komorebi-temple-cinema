from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys
root=Path('/Users/mima1234/temple-cinema-live-sync')
iteration=sys.argv[1]
items=[('HD05 supplied photograph',root/'references/hd/5-照片-6.jpg'),('R08 retained baseline (unaccepted)',root/'qa/ten-reference/05/iteration-scene05-rebuild220-r08-20261024/reference.png'),(iteration+' actual native candidate (unaccepted)',root/f'qa/ten-reference/05/iteration-scene05-rebuild220-{iteration}-20261024/reference.png')]
w=700
canvas=Image.new('RGB',(w*len(items),w+54),'#ede9e2');d=ImageDraw.Draw(canvas)
for i,(name,path) in enumerate(items):
 im=Image.open(path).convert('RGB');im.thumbnail((w,w),Image.Resampling.LANCZOS);canvas.paste(im,(i*w,28));d.text((i*w+10,8),name,fill='#29241d')
d.text((10,w+34),'Comparison only: uniform scaling; no colour correction, retouch or geometry warp. Original native1254 PNGs retained.',fill='#29241d')
canvas.save(root/f'lookdev/scene05-rebuild220/compare220-{iteration}-full.png')
