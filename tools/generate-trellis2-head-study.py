"""Generate one provisional real mesh asset through the official MIT TRELLIS.2 demo.
The generated modeling guide is not a movie frame. Its textures are not used in
our scene: the resulting geometry must be inspected and relit with scene gold.
"""
from pathlib import Path
import json,time,hashlib,shutil,traceback
from gradio_client import Client,handle_file
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'lookdev/trellis2-head-study';OUT.mkdir(parents=True,exist_ok=True)
report={'purpose':'Provisional connected 3D head mesh, never a replacement movie frame','guide':'sculpt-guide-v01.png','model':'microsoft/TRELLIS.2-4B','modelLicense':'MIT','officialDemo':'https://huggingface.co/spaces/microsoft/TRELLIS.2','texturesWillBeUsed':False,'photographicAcceptance':False,'started':time.time(),'status':'connecting'}
def save(): (OUT/'generation-receipt.json').write_text(json.dumps(report,indent=2)+'\n')
save();client=None
try:
 client=Client('https://microsoft-trellis-2.hf.space',token=False,max_workers=2,analytics_enabled=False,download_files=str(OUT/'download'),verbose=False)
 api=client.view_api(return_format='dict',print_info=False);(OUT/'api-info.json').write_text(json.dumps(api,indent=2))
 print(json.dumps({'event':'api-connected','endpoints':list(api.get('named_endpoints',{}))}),flush=True)
 client.predict(api_name='/start_session')
 processed=client.predict(handle_file(str(OUT/'sculpt-guide-v01.png')),api_name='/preprocess_image')
 if isinstance(processed,dict):processed=processed.get('path')
 print(json.dumps({'event':'guide-preprocessed','file':str(processed)}),flush=True)
 report['status']='generating';report['parameters']={'seed':804231,'resolution':'1024','sparse':[7.5,.7,12,5.0],'shape':[7.5,.5,16,3.0],'texture':[1.0,0.0,1,3.0]};save()
 job=client.submit(handle_file(str(processed)),804231,'1024',7.5,.7,12,5.0,7.5,.5,16,3.0,1.0,0.0,1,3.0,api_name='/image_to_3d')
 result=job.result(timeout=900)
 if isinstance(result,str):(OUT/'generated-geometry-preview.html').write_text(result)
 else:(OUT/'generated-preview-result.json').write_text(json.dumps(result,default=str))
 print(json.dumps({'event':'geometry-generated','resultType':type(result).__name__}),flush=True)
 report['status']='extracting-mesh';save()
 files=client.submit(300000,1024,api_name='/extract_glb').result(timeout=600)
 if isinstance(files,str):files=[files]
 candidates=[]
 for item in files:
  path=Path(item.get('path','') if isinstance(item,dict) else str(item))
  if path.is_file() and path.suffix.lower()=='.glb':candidates.append(path)
 if not candidates:raise ValueError('No downloaded GLB in extraction output')
 dst=OUT/'generated-head-provisional.glb';shutil.copy2(candidates[0],dst);data=dst.read_bytes();report.update(status='mesh-generated-unaccepted',file=dst.name,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),finished=time.time());save();print(json.dumps({'event':report['status'],'bytes':len(data),'sha256':report['sha256']}),flush=True)
except Exception as e:
 report.update(status='failed',error=str(e),traceback=traceback.format_exc(),finished=time.time());save();print(json.dumps({'event':'failed','error':str(e)}),flush=True);raise
finally:
 if client:
  try:client.predict(api_name='/end_session')
  except Exception as e:report['cleanupError']=str(e);save()
