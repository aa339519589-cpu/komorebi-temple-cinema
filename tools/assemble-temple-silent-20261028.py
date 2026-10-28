import argparse, json, pathlib, subprocess, hashlib, datetime
p=argparse.ArgumentParser();p.add_argument('--overrides', required=True);p.add_argument('--output',required=True);a=p.parse_args()
base=pathlib.Path('/Users/mima1234/temple-cinema-film-h-ground379-285423ae/output/sol61-rebuild-20261027-h-ground/film-build.json')
build=json.loads(base.read_text()); overrides=json.loads(pathlib.Path(a.overrides).read_text()); out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
shots=[]
for s in build['shots']:
 ref=str(s['reference']); src=pathlib.Path(overrides.get(ref,s['file'])).resolve()
 if not src.is_file(): raise RuntimeError(f'Missing shot {ref}: {src}')
 pr=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_frames,duration','-of','json',str(src)]))['streams'][0]
 if (pr['width'],pr['height'],pr['r_frame_rate'],int(pr['nb_frames']))!=(1080,1080,'24/1',168): raise RuntimeError(f'Invalid shot {ref}: {pr}')
 h=hashlib.sha256()
 with src.open('rb') as f:
  for chunk in iter(lambda:f.read(4194304),b''):h.update(chunk)
 shots.append({'reference':int(ref),'file':str(src),'sha256':h.hexdigest(),'updated':ref in overrides,'probe':pr})
filters=[f'[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v{i}]' for i in range(10)]
previous='v0';length=7
for i,frames in enumerate([27]*6+[26]*3,1):
 d=frames/24; label='blend'+str(i); filters.append(f'[{previous}][v{i}]xfade=transition=fade:duration={d}:offset={length-d:.9f}[{label}]');length+=7-d;previous=label
movie=out/'temple-60s-silent.mp4'; partial=out/'temple-60s-silent.partial.mp4'
if movie.exists() or partial.exists(): raise RuntimeError('Output already exists; preserve existing media')
cmd=['ffmpeg','-n','-hide_banner','-loglevel','error','-filter_complex_threads','1']
for s in shots: cmd+=['-i',s['file']]
cmd+=['-filter_complex',';'.join(filters),'-map',f'[{previous}]','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-r','24','-fps_mode','cfr','-t','60','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',str(partial)]
manifest={'status':'encoding','shots':shots,'audio':None,'fps':24,'durationSeconds':60,'size':[1080,1080],'sourceShotSeconds':7,'overlapFrames':[27]*6+[26]*3,'renderIs3D':True,'visualMatchAccepted':False,'command':cmd,'created':datetime.datetime.now().isoformat()}
(out/'build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
subprocess.run(cmd,check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_entries','stream=codec_type,width,height,r_frame_rate,nb_read_frames,codec_name:format=duration','-of','json',str(partial)]))
v=next(x for x in probe['streams'] if x['codec_type']=='video')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_read_frames']))==(1080,1080,'24/1',1440)
assert abs(float(probe['format']['duration'])-60)<.02
partial.rename(movie); manifest.update(status='encoded',probe=probe,output=str(movie)); (out/'build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'); print('COMPLETE',movie,flush=True)
