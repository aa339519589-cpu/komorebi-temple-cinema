"""Show nine actual decoded frames of the new seven-second3D camera shot."""
from pathlib import Path
import hashlib, json, subprocess
from PIL import Image, ImageDraw

ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
HERE=ROOT/'lookdev/film-sol61-232'
REPORT=Path('/Users/mima1234/temple-cinema-film-f-sol61-232/qa/ten-reference/01/iteration-sol61-rebuild-20261024-f/report.json')
record=json.loads(REPORT.read_text());assert record['status']=='motion-review-rendered'
video=Path(record['motion']['file']);fps=record['motion']['fps'];count=record['motion']['expectedFrames']
assert fps==24 and count==168
assert record['renderSampling']['nativeWidth']==1620 and record['renderSampling']['nativeHeight']==1620
indices=[0,21,42,63,84,105,126,147,167]
selection='+'.join('eq(n\\,%d)'%i for i in indices)
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-vf','select='+selection,'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','pipe:1'])
stride=1080*1080*3;assert len(raw)==len(indices)*stride
board=Image.new('RGB',(1008,1044),'#171713');draw=ImageDraw.Draw(board);frames=[]
for k,index in enumerate(indices):
 data=raw[k*stride:(k+1)*stride];frame=Image.frombytes('RGB',(1080,1080),data);frame.thumbnail((320,320),Image.Resampling.LANCZOS)
 x=12+(k%3)*332;y=12+(k//3)*344
 draw.text((x,y+3),'3D frame %03d / %.3fs'%(index,(index+.5)/fps),fill='#e9d7b4');board.paste(frame,(x,y+22))
 frames.append({'encodedFrame':index,'sourceSampleSeconds':(index+.5)/fps,'decodedRgbSha256':hashlib.sha256(data).hexdigest()})
board.save(HERE/'scene01-f-nine-actual-frames.jpg',quality=93)
proof={'status':'nine-actual-encoded-frames-decoded-no-scene-pixels-authored','video':str(video),'videoSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'sourceHash':record['source']['hash'],'size':[1080,1080],'sourceNativeSize':[1620,1620],'fps':fps,'duration':7,'audio':False,'frames':frames,'scope':'Samples camera progression only, not proof of complete photographic fidelity or absence of temporal artifacts','visualAccepted':False}
(HERE/'scene01-f-contact-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps({'board':str(HERE/'scene01-f-nine-actual-frames.jpg'),'video':str(video),'source':proof['sourceHash']}))
