"""Read facial landmarks for an unaccepted sculptural scaffold study.

Predicted Z coordinates are a human-face model's prior, not measured depth of
the statue. The reference crop and generated clay guide remain separate.
"""
from pathlib import Path
import json,hashlib,os
os.environ.setdefault('MPLBACKEND','Agg')
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'lookdev/buddha-face-study'
MODEL=Path(os.environ.get('FACE_LANDMARK_MODEL',str(Path.home()/'.cache/temple-face-models/face_landmarker.task')))
options=vision.FaceLandmarkerOptions(
 base_options=python.BaseOptions(model_asset_path=str(MODEL),delegate=python.BaseOptions.Delegate.CPU),
 running_mode=vision.RunningMode.IMAGE,num_faces=1,
 min_face_detection_confidence=.35,min_face_presence_confidence=.35,
 output_facial_transformation_matrixes=True)
report={'status':'study-only','library':mp.__version__,'modelSha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),
 'photographicAcceptance':False,'measuredDepth':False,
 'limits':['Landmarks and their Z values are estimates, not recovered historical sculpture dimensions.',
           'The generated guide is an interpretation and must not override the original image.'], 'inputs':[]}
with vision.FaceLandmarker.create_from_options(options) as estimator:
 for stem in ['reference-head-crop','generated-clay-guide']:
  path=OUT/(stem+'.png');result=estimator.detect(mp.Image.create_from_file(str(path)))
  original=Image.open(path).convert('RGB');width,height=original.size
  entry={'name':stem,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
   'size':[width,height],'detectedFaces':len(result.face_landmarks)}
  if result.face_landmarks:
   landmarks=[[p.x,p.y,p.z] for p in result.face_landmarks[0]]
   data={'source':stem,'sourceSize':[width,height],'sourceSha256':entry['sourceSha256'],
    'points':landmarks,'transformationMatrix':result.facial_transformation_matrixes[0].tolist(),
    'scope':'Estimated anatomical scaffold only; not metric recovered sculpture and not an accepted scene asset.'}
   (OUT/(stem+'-landmarks.json')).write_text(json.dumps(data,indent=2))
   preview=original.resize((760,round(760*height/width)),Image.Resampling.LANCZOS)
   draw=ImageDraw.Draw(preview)
   for i in [1,4,10,33,61,78,133,145,152,159,168,234,263,291,308,362,374,386,454]:
    x,y,_=landmarks[i];x*=preview.width;y*=preview.height
    draw.ellipse((x-3,y-3,x+3,y+3),fill='#3bffb4',outline='#0f2e19')
   preview.save(OUT/(stem+'-landmark-check.png'))
   entry['landmarkCount']=len(landmarks)
  report['inputs'].append(entry)
(OUT/'landmark-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report),flush=True)
