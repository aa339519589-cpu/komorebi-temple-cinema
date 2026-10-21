from pathlib import Path
from PIL import Image,ImageDraw
import sys
root=Path(__file__).resolve().parents[2]
revision=sys.argv[1]
folder=root/'qa/ten-reference/09'/('iteration-scene09-monumental-night145-'+revision)
out=Path(__file__).resolve().parent/revision
out.mkdir(exist_ok=True)
ref=Image.open(root/'references/hd/8-照片-9.jpg').convert('RGB')
base=Image.open(root/'qa/ten-reference/09/iteration-scene09-grounded-site-r17-canonical-20261021/reference.png').convert('RGB')
now=Image.open(folder/'reference.png').convert('RGB')
w=627
canvas=Image.new('RGB',(w*3,w+30),'#171b20');draw=ImageDraw.Draw(canvas)
for i,(label,im) in enumerate([('Supplied reference',ref),('Prior R17 native 1254',base),(revision+' native 1254',now)]):
 canvas.paste(im.resize((w,w),Image.Resampling.LANCZOS),(i*w,30));draw.text((i*w+12,9),label,fill='white')
canvas.save(out/'reference-r17-current.jpg',quality=94)
# This right panel is a second real native subfrustum capture, not a crop
# enlarged from the full native image. Its official report records the view.
close=Image.open(folder/'detail-native.png').convert('RGB')
sourceclose=ref.crop((490,280,1140,930))
canvas=Image.new('RGB',(1254*2,1284),'#171b20');draw=ImageDraw.Draw(canvas)
canvas.paste(sourceclose.resize((1254,1254),Image.Resampling.LANCZOS),(0,30));canvas.paste(close,(1254,30))
draw.text((16,9),'Reference comparison region (source photograph crop)',fill='white');draw.text((1270,9),'Actual 1254 native 3D hall subfrustum: '+revision,fill='white')
canvas.save(out/'reference-hall-vs-native-subfrustum.jpg',quality=94)
print(out)
