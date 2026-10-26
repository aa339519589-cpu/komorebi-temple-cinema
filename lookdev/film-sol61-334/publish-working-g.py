from pathlib import Path
import json,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[2]
LANE=ROOT/'lookdev/film-sol61-334'
authorization=json.loads((LANE/'source-authorization.json').read_text())
iteration=authorization['iteration'];snapshot=Path(authorization['snapshotRoot'])
original=snapshot/'output'/iteration;destination=ROOT/'output'/iteration
review=json.loads((original/'root-personal-review.json').read_text())
assert review['personallyViewed'] and not review['photographicAccepted']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def clone(source,target):
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        assert sha(source)==sha(target),target
        return
    subprocess.run(['/bin/cp','-c',str(source),str(target)],check=True)
    assert sha(source)==sha(target)
for p in original.rglob('*'):
    if p.is_file(): clone(p,destination/p.relative_to(original))
build=json.loads((original/'film-build.json').read_text())
presentation={**build,'status':'ten-scene-working-rendered','personalReview':review,'publicFilmSource':authorization['commit']}
for edit in presentation['edits']:edit['duration']=round(float(edit['probe']['format']['duration']))
(destination/'presentation.json').write_text(json.dumps(presentation,indent=2)+'\n')
frameDir=ROOT/'qa/ten-reference'/('film-review-'+iteration)
scenes=json.loads((ROOT/'reconstructions/ten-scenes.json').read_text())['scenes'];frames=[]
for scene,shot in zip(scenes,build['shots']):
    n=shot['reference'];source=Path(shot['file']).parent/'frame-0167.png';target=frameDir/f'scene-{n:02d}-end.png';clone(source,target)
    frames.append({'reference':n,'name':scene['name'],'referenceFile':scene['referenceFile'],'nativeFile':str(target.relative_to(ROOT)),'sourceHash':shot['source']['hash'],'nativeFrameIndex':167,'sourceVideoSha256':shot['videoSha256'],'pngSha256':sha(target),'photographicAccepted':False})
(frameDir/'frames.json').write_text(json.dumps({'status':'actual-native-source-shot-endpoints','sourceCommit':authorization['commit'],'frames':frames,'photographicAccepted':False},indent=2)+'\n')
page=ROOT/'film.html';s=page.read_text().replace('sol61-rebuild-20261024-f-resume1',iteration)
s=s.replace("prefix+'film-build.json'","prefix+'presentation.json'").replace("report.status==='ten-scene-draft-rendered'","['ten-scene-draft-rendered','ten-scene-working-rendered'].includes(report.status)")
s=s.replace('下方播放器保留 10 月 24 日工作影片；新版本完成画面复核后替换。','当前播放器：10 月 26 日十景工作影片。所有场景继续重建。')
s=s.replace('两版剪辑与画面复核继续进行。','两版工作剪辑已更新到下方播放器；模型修进继续。')
s=s.replace('供桌和房间结构正在继续重建。','所有场景的建模、材质与光影仍在修进。')
s=s.replace('新的胁侍手部与窗光见“建模对照”；包含本轮修改的十景影片正在录制。','上方新十景影片已包含新的胁侍手部与窗光；此处保留此前单镜头版本。')
page.write_text(s)
print(json.dumps({'publicOutput':str(destination),'frameDirectory':str(frameDir),'sourceCommit':authorization['commit'],'photographicAccepted':False}))
