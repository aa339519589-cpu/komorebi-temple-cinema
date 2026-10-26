from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,ctypes,os,datetime
root=Path(__file__).resolve().parents[2];out=root/'qa/ten-reference/working-model-review-20261026-r';assert not (out/'frames.json').exists();out.mkdir(parents=True,exist_ok=True)
previous=json.loads((root/'qa/ten-reference/working-model-review-20261026-q/frames.json').read_text());frames=previous['frames'];sources={
2:('lookdev/scene02-craft342/candidate-r06/qa/ten-reference/02/iteration-scene02-craft342-r06-full/reference.png','lookdev/scene02-craft342/candidate-r06/qa/ten-reference/02/iteration-scene02-craft342-r06-full/report.json','reference'),
3:('lookdev/scene03-botany344/candidate-r04/qa/ten-reference/03/iteration-scene03-botany344-r04-flower-focused-motion/shot-6p99.png','lookdev/scene03-botany344/candidate-r04/qa/ten-reference/03/iteration-scene03-botany344-r04-flower-focused-motion/report.json','shot-6p99'),
4:('lookdev/scene04-lantern343/candidate-r02/qa/ten-reference/04/iteration-scene04-lantern343-r02-full-lantern-native/reference.png','lookdev/scene04-lantern343/candidate-r02/qa/ten-reference/04/iteration-scene04-lantern343-r02-full-lantern-native/report.json','reference'),
7:('lookdev/scene07-garden340/candidate-r06/qa/ten-reference/07/iteration-scene07-garden340-r06-full/reference.png','lookdev/scene07-garden340/candidate-r06/qa/ten-reference/07/iteration-scene07-garden340-r06-full/report.json','reference'),
9:('lookdev/scene09-light341/candidate-r04/qa/ten-reference/09/iteration-scene09-light341-r04-full-shore-detail-20261026/reference.png','lookdev/scene09-light341/candidate-r04/qa/ten-reference/09/iteration-scene09-light341-r04-full-shore-detail-20261026/report.json','reference')}


clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile;clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int];proof=[]
for f in frames:
 n=f['reference']
 if n in sources:
  image,report,name=sources[n];r=json.loads((root/report).read_text());f.update(native=image,report=report,nativeFrameName=name,sourceHash=r['source']['hash'],startedAt=r['startedAt'])
  if n in sources:f['scope']='Actual native moving camera at6.99s; near-final pullback pose, not a reference photo' if n==3 else 'Actual native fixed-reference camera; independent working model checkpoint.'
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
manifest={'status':'ten-independent-working-model-views-not-photographically-accepted','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'All10 reference pairs with exact actual source identities; independent static/camera-review images, not a newly captured coherent film. Scene02 includes342R06 carpentry/return,03 includes344R04 botanical curves/focus,04 includes343R02 stone lamps,07 includes340R06 connected islands/natural fir,09 includes341R04 practical cases/rooted banks. Scene03 is an actual6.99s moving endpoint. This independent model board is newer than fixed FilmG and is not its frame source. Main pose has known unresolved local self contacts; no photographic acceptance. Cycles studies are separate.','frames':frames,'boardLicense':'Component-specific terms remain. Scene04/06 combined statue-derived imagery CC-BY-NC-SA4 for personal noncommercial use.','photographicAccepted':False}
(out/'frames.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(root/'lookdev/current-scenes282/retained-review-r.json').write_text(json.dumps({'images':proof,'resizingForContactBoardOnly':True,'actualImagesIndependentExactByteCopies':True,'photographicAccepted':False},indent=2)+'\n')
p=root/'film.html';s=p.read_text();assert s.count('working-model-review-20261026-q/frames.json')==1;p.write_text(s.replace('working-model-review-20261026-q/frames.json','working-model-review-20261026-r/frames.json'))
print(json.dumps({'pairs':len(frames),'board':str(out/'all-ten-reference-left-render-right.jpg')}))
