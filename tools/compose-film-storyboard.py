from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path(__file__).resolve().parent.parent
out=root/'output/hour-1832-film';width=360;head=32
sheet=Image.new('RGB',(width*3,(width+head)*10),'#10120f');draw=ImageDraw.Draw(sheet);font=ImageFont.load_default(size=17)
report=[]
for n in range(1,11):
 folder=root/f'qa/ten-reference/{n:02d}/iteration-hour-1832-film'
 for col,i in enumerate([0,105,209]):
  path=folder/f'frame-{i:04d}.png';y=(n-1)*(width+head);x=col*width
  draw.text((x+8,y+7),f'{n:02d} / {i/30:.2f}s',font=font,fill='#e4d5a5')
  if path.exists():sheet.paste(Image.open(path).convert('RGB').resize((width,width),Image.Resampling.LANCZOS),(x,y+head))
  else:draw.text((x+8,y+head+15),'Rendering...',font=font,fill='#b8b4a5')
  report.append({'reference':n,'frame':i,'exists':path.exists()})
sheet.save(out/'shot-storyboard.jpg',quality=95,subsampling=0)
print(json.dumps({'file':str(out/'shot-storyboard.jpg'),'capturedFrames':sum(p['exists'] for p in report),'requestedFrames':30}))
