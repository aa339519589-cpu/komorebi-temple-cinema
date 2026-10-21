from pathlib import Path
import sys,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
iteration=sys.argv[1] if len(sys.argv)>1 else 'scene05-monumental-tower-v3-r03-native-20261021'
qa=ROOT/'qa/ten-reference/05'/('iteration-'+iteration)
photo=Image.open(ROOT/'references/hd/5-照片-6.jpg').convert('RGB')
native=Image.open(qa/'reference.png').convert('RGB')
assert photo.size==native.size==(1254,1254)
board=Image.new('RGB',(2508,1254));board.paste(photo,(0,0));board.paste(native,(1254,0));board.save(qa/'hd05-left-native-right.png')
report=json.loads((qa/'report.json').read_text());x,y,size,full=report['detailCrop']['pixels']
crop=photo.crop((x,y,x+size,y+size));crop.save(qa/'source-true-corner-crop.png')
detail=Image.open(qa/'detail-native.png').convert('RGB')
# Comparison display only: native extra-resolution detail is downsampled to
# the source photo's actual crop pixels. The original GPU PNG is retained.
pair=Image.new('RGB',(size*2,size));pair.paste(crop,(0,0));pair.paste(detail.resize((size,size),Image.Resampling.LANCZOS),(size,0));pair.save(qa/'true-corner-left-native-right.png')
(qa/'comparison-scope.json').write_text(json.dumps({'source':'references/hd/5-照片-6.jpg','nativeSourceHash':report['source']['hash'],'fullBoard':'Original1254px photo at left; actual1254px GPU scene at right, no color correction or image warp.','detailBoard':f'Actual{size}px source crop at left; independently rendered subfrustum at right, downsampled only for equal-pixel comparison. Original detail-native.png remains{detail.width}px.','photoRole':'Comparison only, not a runtime map, plate or exported geometry.','visualAccepted':False},indent=2)+'\n')
print(qa)
