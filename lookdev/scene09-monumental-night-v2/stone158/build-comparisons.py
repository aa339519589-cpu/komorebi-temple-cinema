from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
ref=Image.open(ROOT/'references/hd/8-照片-9.jpg').convert('RGB');old=Image.open(ROOT/'qa/ten-reference/09/iteration-scene09-monumental-night145-r05/reference.png').convert('RGB');now=Image.open(ROOT/'qa/ten-reference/09/iteration-scene09-square-toro158-r04/reference.png').convert('RGB')
w=627;sheet=Image.new('RGB',(w*3,w+30),'#171b20');draw=ImageDraw.Draw(sheet)
for i,(im,label) in enumerate([(ref,'Reference09'),(old,'Public R05 native'),(now,'Toro158 R04 native')]):sheet.paste(im.resize((w,w),Image.Resampling.LANCZOS),(w*i,30));draw.text((w*i+14,9),label,fill='white')
sheet.save(OUT/'reference-r05-r04-full.jpg',quality=94)
close=Image.open(ROOT/'qa/ten-reference/09/iteration-scene09-square-toro158-r04/detail-native.png').convert('RGB');source=ref.crop((72,525,462,915));sheet=Image.new('RGB',(2508,1284),'#171b20');draw=ImageDraw.Draw(sheet);sheet.paste(source.resize((1254,1254),Image.Resampling.LANCZOS),(0,30));sheet.paste(close,(1254,30));draw.text((14,9),'Reference photograph comparison region (resized crop)',fill='white');draw.text((1270,9),'Actual1254 native3D hero subfrustum - Toro158 R04',fill='white');sheet.save(OUT/'reference-vs-true-hero-native-r04.jpg',quality=94)
w=480;sheet=Image.new('RGB',(w*4,w+30),'#171b20');draw=ImageDraw.Draw(sheet)
for i,label in enumerate(['r01','r02','r03','r04']):
 im=Image.open(ROOT/f'qa/ten-reference/09/iteration-scene09-square-toro158-{label}/detail-native.png').convert('RGB');sheet.paste(im.resize((w,w),Image.Resampling.LANCZOS),(i*w,30));draw.text((i*w+14,9),label+(' held, unaccepted' if i==3 else ' superseded after inspection'),fill='white')
sheet.save(OUT/'native-hero-repair-sequence.jpg',quality=94)
