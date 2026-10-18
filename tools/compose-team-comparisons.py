"""Place unaltered reference and actual code-rendered frames side by side."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
NAMES=['0-照片-1.jpg','1-照片-2.jpg','2-照片-3.jpg','3-照片-4.jpg','5-照片-6.jpg','4-照片-5.jpg','6-照片-7.jpg','7-照片-8.jpg','8-照片-9.jpg','9-照片-10.jpg']
p=argparse.ArgumentParser();p.add_argument('--iteration',default='01');p.add_argument('--references',default='1,2,3,4,5,6,7,8,9,10');p.add_argument('--worktree');a=p.parse_args()
overview=Image.new('RGB',(1920,2520),'#101310');od=ImageDraw.Draw(overview)
captured=[]
for number in map(int,a.references.split(',')):
 ident=f'{number:02}';worktree=Path(a.worktree) if a.worktree else Path(f'/Users/mima1234/temple-scene-{ident}');folder=worktree/f'qa/ten-reference/{ident}/iteration-{a.iteration}'
 render=folder/'reference.png';report_file=folder/'report.json';reference=ROOT/'references/hd'/NAMES[number-1]
 if not render.exists() or not report_file.exists():continue
 report=json.loads(report_file.read_text())
 if report['status']!='rendered-review':continue
 actual=Image.open(render).convert('RGB');size=actual.width
 pair=Image.new('RGB',(size*2,size+40),'#101310');pd=ImageDraw.Draw(pair)
 pair.paste(ImageOps.contain(Image.open(reference).convert('RGB'),(size,size)),(0,40));pair.paste(actual,(size,40))
 pd.text((10,13),f'{ident} REFERENCE',fill='#eee0b9');pd.text((size+10,13),f'ACTUAL THREE.JS / iteration {a.iteration} / NOT ACCEPTED',fill='#eee0b9')
 pair.save(folder/'comparison.png')
 x=((number-1)%2)*960;y=((number-1)//2)*504
 thumb=ImageOps.contain(pair,(950,500));overview.paste(thumb,(x,y));captured.append(number)
destination=ROOT/'output/ten-reference-rebuild';destination.mkdir(parents=True,exist_ok=True)
overview.save(destination/f'comparisons-{a.iteration}.jpg',quality=96)
print(json.dumps({'captured':captured,'iteration':a.iteration,'overview':str(destination/f'comparisons-{a.iteration}.jpg')}))
