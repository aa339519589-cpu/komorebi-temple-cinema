from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
paths=[('R17 native opening','qa/ten-reference/09/iteration-scene09-solmax-grounded-site-dolly-r17-poses-20261021/shot-0.png'),('R04 thin crowns - rejected','qa/ten-reference/09/iteration-scene09-monumental-night145-r04-opening-mid/shot-0.png'),('R05 held native opening','qa/ten-reference/09/iteration-scene09-monumental-night145-r05-opening-mid/shot-0.png')]
w=640;out=Image.new('RGB',(w*3,w+30),'#171b20');draw=ImageDraw.Draw(out)
for i,(label,path) in enumerate(paths):
 im=Image.open(root/path).convert('RGB');out.paste(im.resize((w,w),Image.Resampling.LANCZOS),(i*w,30));draw.text((i*w+12,9),label,fill='white')
out.save(Path(__file__).resolve().parent/'r05/opening-crown-repair.jpg',quality=94)
