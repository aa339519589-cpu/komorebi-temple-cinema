"""Labelled comparison sheets, no retouching or generated replacement pixels.

Photograph crop is enlarged and labelled. All native face columns are genuine
1254x1254 subfrustum renders of the same95-pixel original-camera field.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
QA=ROOT/'qa/ten-reference/06'
PHOTO=Path('/Users/mima1234/temple-cinema-live-sync/references/hd/4-照片-5.jpg')
font='/System/Library/Fonts/Supplemental/Arial.ttf'
title=ImageFont.truetype(font,24);small=ImageFont.truetype(font,18)
photo=Image.open(PHOTO).convert('RGB');photo.crop((584,331,679,426)).save(OUT/'reference-native95.png')
columns=[('Original HD','Reference photograph; crop enlarged',None),
         ('selected32','True low-camera subfrustum','seat-contact32-native58'),
         ('56 clean / old position','True low-camera subfrustum','makehuman56'),
         ('58 clean / corrected position','True low-camera subfrustum','makehuman58-clean-positioned')]
tile=640;header=76
def sheet(name,cols,detail):
    image=Image.new('RGB',(tile*len(cols),tile+header),'#161616');draw=ImageDraw.Draw(image)
    inputs=[]
    for k,(label,note,iteration) in enumerate(cols):
        if iteration is None:
            source=photo.crop((584,331,679,426)) if detail else photo.copy();path=PHOTO
        else:
            path=QA/f'iteration-{iteration}'/('detail-native.png' if detail else 'reference.png')
            source=Image.open(path).convert('RGB')
        image.paste(source.resize((tile,tile),Image.Resampling.LANCZOS),(k*tile,header))
        draw.text((k*tile+14,12),label,font=title,fill='white')
        draw.text((k*tile+14,45),note if detail else ('Reference photograph' if iteration is None else 'Actual1254 native main frame'),font=small,fill='#cccccc')
        inputs.append({'label':label,'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    image.save(OUT/name)
    return inputs
records={}
records['face']=sheet('comparison-face-four-way.png',columns,True)
records['full']=sheet('comparison-full-four-way.png',columns,False)
rejected=[('56 clean / old position','True camera subfrustum','makehuman56'),
          ('57 local-jaw lift rejected','True camera subfrustum','makehuman57'),
          ('58 ear profile rejected','True camera subfrustum','makehuman58'),
          ('58 clean / corrected position','True camera subfrustum','makehuman58-clean-positioned')]
records['rejected']=sheet('comparison-rejected-shapes.png',rejected,True)
(OUT/'comparison-receipt.json').write_text(json.dumps({'status':'unaccepted-review','order':'Original HD / selected32 /56 /58 clean-positioned','processing':'Crop, resample and labelled side-by-side layout only. No image retouch, colour gain or replacement of any scene image.','physicalCamera':{'position':[0,.58,8.4],'target':[0,2.4,-2.3],'fov':62},'nativeDetailCrop':[584,331,95,1254],'inputs':records},indent=2)+'\n')
