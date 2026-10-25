from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,ctypes,os,datetime
root=Path(__file__).resolve().parents[2];out=root/'qa/ten-reference/working-model-review-20261025-o';assert not (out/'frames.json').exists();out.mkdir(parents=True,exist_ok=True)
previous=json.loads((root/'qa/ten-reference/working-model-review-20261025-n/frames.json').read_text());frames=previous['frames'];sources={
1:('lookdev/scene01-craft298/candidate-r15/qa/ten-reference/01/iteration-scene01-shore298-r15-full-and-bank-detail/reference.png','lookdev/scene01-craft298/candidate-r15/qa/ten-reference/01/iteration-scene01-shore298-r15-full-and-bank-detail/report.json','reference'),
3:('lookdev/scene03-craft308/candidate-r03/qa/ten-reference/03/iteration-scene03-craft308-r03-full-detail-repaired-dependency/reference.png','lookdev/scene03-craft308/candidate-r03/qa/ten-reference/03/iteration-scene03-craft308-r03-full-detail-repaired-dependency/report.json','reference'),
6:('lookdev/scene06-integrated309/candidate-r01/qa/ten-reference/06/iteration-scene06-integrated309-cabinet-halo/reference.png','lookdev/scene06-integrated309/candidate-r01/qa/ten-reference/06/iteration-scene06-integrated309-cabinet-halo/report.json','reference')}

clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile;clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int];proof=[]
for f in frames:
 n=f['reference']
 if n in sources:
  image,report,name=sources[n];r=json.loads((root/report).read_text());f.update(native=image,report=report,nativeFrameName=name,sourceHash=r['source']['hash'],startedAt=r['startedAt'])
  if n in sources:f['scope']='Actual native fixed-reference camera; independent working model checkpoint.'
 source=root/f['native'];target=out/f'scene-{n:02d}.png';
 if target.exists():assert hashlib.sha256(target.read_bytes()).digest()==hashlib.sha256(source.read_bytes()).digest()
 else:assert clone(os.fsencode(source),os.fsencode(target),0)==0
 f['originalNative']=f['native'];f['native']=str(target.relative_to(root));f['pngSha256']=hashlib.sha256(target.read_bytes()).hexdigest();f['visualAccepted']=False
 proof.append({'reference':n,'sourceHash':f['sourceHash'],'original':str(source),'retained':str(target.relative_to(root)),'sha256':f['pngSha256']})
scenes=json.loads((root/'reconstructions/ten-scenes.json').read_text())['scenes'];cell=320;gap=12;head=26;pairw=cell*2+gap;rowh=cell+head+gap;board=Image.new('RGB',(pairw*2+gap*3,rowh*5+gap),(19,19,19));draw=ImageDraw.Draw(board)
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',14)
for i,f in enumerate(frames):
 x=gap+(i%2)*(pairw+gap);y=gap+(i//2)*rowh;draw.text((x,y+4),f'{f["reference"]:02d} REFERENCE',font=font,fill='#dddddd');draw.text((x+cell+gap,y+4),'3D WORKING VIEW',font=font,fill='#dddddd')
 for xx,path in [(x,root/scenes[i]['referenceFile'].lstrip('/')),(x+cell+gap,root/f['native'])]:
  image=Image.open(path).convert('RGB');image.thumbnail((cell,cell),Image.Resampling.LANCZOS);board.paste(image,(xx,y+head))
board.save(out/'all-ten-reference-left-render-right.jpg',quality=94)
manifest={'status':'ten-independent-working-model-views-not-photographically-accepted','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'All10 reference pairs with exact actual source identities; independent static/camera-review images, not a newly captured coherent film. Scene06 includes284 native daylight,299 mat construction,293 cabinet cases and305 R03 mandorla; excludes in-progress257 side figures and295 main-arm poses. Cycles studies are separate.','frames':frames,'boardLicense':'Component-specific terms remain. Scene04/06 combined statue-derived imagery CC-BY-NC-SA4 for personal noncommercial use.','photographicAccepted':False}
(out/'frames.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(root/'lookdev/current-scenes282/retained-review-o.json').write_text(json.dumps({'images':proof,'resizingForContactBoardOnly':True,'actualImagesIndependentExactByteCopies':True,'photographicAccepted':False},indent=2)+'\n')
p=root/'film.html';s=p.read_text();assert s.count('working-model-review-20261025-n/frames.json')==1;p.write_text(s.replace('working-model-review-20261025-n/frames.json','working-model-review-20261025-o/frames.json'))
print(json.dumps({'pairs':len(frames),'board':str(out/'all-ten-reference-left-render-right.jpg')}))
