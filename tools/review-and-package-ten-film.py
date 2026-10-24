"""Package an actual ten-shot render, with its source receipts and review views."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json,os,subprocess,sys,zipfile

ROOT=Path(os.environ.get('FILM_CAPTURE_ROOT',Path(__file__).resolve().parents[1])).resolve()
iteration=sys.argv[1] if len(sys.argv)>1 else 'mesh-film-20261019-r02'
if not iteration.replace('-','').replace('_','').isalnum():raise ValueError('Invalid iteration')
OUT=ROOT/'output'/iteration
report=json.loads((OUT/'film-build.json').read_text())
if report['status']!='ten-scene-draft-rendered':raise RuntimeError('Ten actual shots are not complete')
fps=int(report['fps'])
if fps not in [24,25,30,60]:raise ValueError('Unsupported actual capture cadence')
shots=sorted(report['shots'],key=lambda s:s['reference'])
if [s['reference'] for s in shots]!=list(range(1,11)):raise ValueError('All ten scenes are required')
package=None if os.environ.get('FILM_SKIP_ZIP')=='1' else OUT/'ten-source-shots-and-receipts.zip'
if package is not None and package.exists():raise FileExistsError('Keep the previous package; select a new output iteration')
font=ImageFont.load_default(size=17)
width,header=360,32
story=Image.new('RGB',(width*3,(width+header)*10),'#141713');draw=ImageDraw.Draw(story)
compare=Image.new('RGB',(480*2,(480+header)*10),'#141713');cdraw=ImageDraw.Draw(compare)
prefixes=[0,1,2,3,5,4,6,7,8,9]
media={'status':'technical-media-receipt','sourceCommit':report['sourceCommit'],'fps':fps,'visualAccepted':False,'frameReviewScope':'First/middle/last actual source frames; does not establish every-frame photographic fidelity','reviewToolSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'masters':[],'shots':[]}
stills=[]
for shot in shots:
 n=shot['reference'];file=Path(shot['file']).resolve()
 if not file.is_relative_to(ROOT) or not file.exists():raise ValueError('Shot is not a retained project artifact')
 sha=hashlib.sha256(file.read_bytes()).hexdigest()
 if sha!=shot['videoSha256']:raise ValueError('Shot bytes changed')
 row=(n-1)*(width+header)
 if shot['frames']!=7*fps:raise ValueError('Actual source shot frame count differs')
 for col,index in enumerate([0,shot['frames']//2,shot['frames']-1]):
  frame=file.parent/f'frame-{index:04d}.png'
  if not frame.exists():raise FileNotFoundError(frame)
  image=Image.open(frame).convert('RGB');story.paste(image.resize((width,width),Image.Resampling.LANCZOS),(col*width,row+header))
  draw.text((col*width+8,row+7),f'{n:02d} / camera sample {(index+.5)/fps:.3f}s',font=font,fill='#e4d5a5')
  stills.append((frame,f'stills/{n:02d}-{index:04d}.png'))
 refs=list((ROOT/'references/hd').glob(str(prefixes[n-1])+'-*.jpg'))
 if len(refs)!=1:raise ValueError('Ambiguous reference image')
 y=(n-1)*(480+header)
 compare.paste(Image.open(refs[0]).convert('RGB').resize((480,480),Image.Resampling.LANCZOS),(0,y+header))
 compare.paste(image.resize((480,480),Image.Resampling.LANCZOS),(480,y+header))
 cdraw.text((8,y+7),f'{n:02d} / Reference',font=font,fill='#e4d5a5');cdraw.text((488,y+7),f'{n:02d} / Actual 3D end frame',font=font,fill='#e4d5a5')
 media['shots'].append({'reference':n,'sha256':sha,'sourceHash':shot['source']['hash'],'reusedIdenticalSourceShot':shot.get('reusedIdenticalSourceShot',False),'actualWebgl':shot['actualWebgl'],'visualAccepted':False})
story.save(OUT/'shot-storyboard.jpg',quality=95,subsampling=0)
compare.save(OUT/'references-left-renders-right.jpg',quality=95,subsampling=0)
for seconds,frames in [(60,60*fps),(70,70*fps)]:
 path=OUT/f'temple-ten-scenes-{seconds}s.mp4'
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration','-of','json',str(path)]))
 video=next(s for s in probe['streams'] if s['codec_type']=='video');audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
 if [video['width'],video['height']]!=report['size'] or video['r_frame_rate']!=f'{fps}/1' or int(video['nb_frames'])!=frames or abs(float(probe['format']['duration'])-seconds)>.04:raise ValueError('Master duration or frame layout does not match')
 subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 media['masters'].append({'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'probe':probe})
(OUT/'media-receipt.json').write_text(json.dumps(media,indent=2)+'\n')
if package is not None:
 with zipfile.ZipFile(package,'x',compression=zipfile.ZIP_STORED,allowZip64=True) as z:
  for shot in shots:z.write(shot['file'],f'shots/scene-{shot["reference"]:02d}-7s.mp4')
  for p,name in stills:z.write(p,name)
  for name in ['film-build.json','media-receipt.json','RELEASE-NOTES.md','shot-storyboard.jpg','references-left-renders-right.jpg']:z.write(OUT/name,name)
  z.write(ROOT/'CREDITS.txt','CREDITS.txt')
print(json.dumps({'status':'reviewed-actual-ten-scene-draft','sourceCommit':report['sourceCommit'],'output':str(OUT),'packageBytes':package.stat().st_size if package is not None else None,'visualAccepted':False}),flush=True)
