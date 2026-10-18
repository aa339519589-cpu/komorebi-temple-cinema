"""Compose original/current render pairs. It never paints over either image."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime
ROOT=Path(__file__).resolve().parent.parent
selections={1:'parallel40',2:'parallel47',3:'parallel44',4:'parallel47',5:'exterior-satin35',6:'seat-contact32',7:'parallel45',8:'parallel43',9:'parallel44',10:'parallel46'}
progress_path=ROOT/'qa/ten-reference/progress.json'
progress=json.loads(progress_path.read_text())
font_path=Path('/System/Library/Fonts/PingFang.ttc')
def font(size):
 try:return ImageFont.truetype(str(font_path),size)
 except OSError:return ImageFont.load_default(size=size)
thumb=512;header=42;sheet=Image.new('RGB',(thumb*4,(thumb+header)*5),'#10120f');draw=ImageDraw.Draw(sheet)
for record in progress['scenes']:
 n=record['reference'];folder=ROOT/f'qa/ten-reference/{n:02d}/iteration-{selections[n]}'
 actual=folder/'reference.png';receipt=json.loads((folder/'report.json').read_text())
 original=ROOT/record['referenceFile'].lstrip('/')
 left=Image.open(original).convert('RGB');right=Image.open(actual).convert('RGB')
 if left.size!=right.size:raise RuntimeError(f'Unequal original/render size for {n}: {left.size} vs {right.size}')
 width,height=left.size;pair=Image.new('RGB',(width*2,height+header),'#10120f');pd=ImageDraw.Draw(pair)
 pd.text((15,10),f'{n:02d} ORIGINAL REFERENCE',font=font(20),fill='#e4d5a5')
 pd.text((width+15,10),f'ACTUAL THREE.JS / {selections[n]} / IN PROGRESS',font=font(20),fill='#e4d5a5')
 pair.paste(left,(0,header));pair.paste(right,(width,header));pair.save(folder/'current-comparison.jpg',quality=96,subsampling=0)
 col=(n-1)%2;row=(n-1)//2;x=col*thumb*2;y=row*(thumb+header)
 draw.text((x+10,y+10),f'{n:02d} ORIGINAL  |  CURRENT 3D',font=font(21),fill='#e4d5a5')
 sheet.paste(left.resize((thumb,thumb),Image.Resampling.LANCZOS),(x,y+header));sheet.paste(right.resize((thumb,thumb),Image.Resampling.LANCZOS),(x+thumb,y+header))
 record.update(actualFrame=str(actual.relative_to(ROOT)),comparison=str((folder/'current-comparison.jpg').relative_to(ROOT)),sceneSourceHash=receipt['source']['hash'],sourceCodeCommit=receipt['sourceCommit'],renderedSize=width,visualAccepted=False)
 record['imageSha256']=hashlib.sha256(actual.read_bytes()).hexdigest()
 record['sourceHashVerifiedAgainstCurrentCode']=False
out=ROOT/'output/hour-1832-film';out.mkdir(parents=True,exist_ok=True);sheet.save(out/'all-ten-original-and-current.jpg',quality=94,subsampling=0)
public=ROOT/'qa/ten-reference/hour-1832';public.mkdir(parents=True,exist_ok=True);sheet.save(public/'all-ten-original-and-current.jpg',quality=94,subsampling=0)
progress.update(updatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='All ten actual independent 3D scenes. Parallel modeling and material pass, with actual original/current images.',visualAcceptance=False,completedFilm=False,contactSheet='qa/ten-reference/hour-1832/all-ten-original-and-current.jpg')
progress['runtimeChecks']['actualStillSize']='1254 x1254 for all ten selected stills; live film rendering separately at1080 x1080.'
progress_path.write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'contactSheet':str(public/'all-ten-original-and-current.jpg'),'scenes':10,'visualAccepted':False}))
