/** Bound pending GPU work on memory-limited virtual Metal devices. No scene changes. */
export function installBoundedGpuSubmission(renderer,{drawLimit=48,triangleLimit=1500000}={}){
 const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),device=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'';
 const active=/Paravirtual/i.test(device),report={active,device,drawLimit,triangleLimit,totalDraws:0,estimatedSubmittedTriangles:0,barriers:0,waitMilliseconds:0,errors:[]};
 renderer.gpuSubmissionInfo=()=>({...report,errors:[...report.errors]});
 if(!active)return;
 const original=renderer.renderBufferDirect.bind(renderer);let pendingDraws=0,pendingTriangles=0;
 renderer.renderBufferDirect=function(camera,scene,geometry,material,object,group){
  const result=original(camera,scene,geometry,material,object,group);
  const elements=geometry.index?.count??geometry.attributes.position?.count??0,range=geometry.drawRange;
  const count=Math.min(elements,Number.isFinite(range?.count)?range.count:elements,Number.isFinite(group?.count)?group.count:elements);
  const triangles=Math.ceil(count/3)*(object.isInstancedMesh?object.count:1);
  report.totalDraws++;report.estimatedSubmittedTriangles+=triangles;pendingDraws++;pendingTriangles+=triangles;
  if(pendingDraws>=drawLimit||pendingTriangles>=triangleLimit){
   const start=performance.now();gl.finish();report.waitMilliseconds+=performance.now()-start;report.barriers++;pendingDraws=pendingTriangles=0;
   const error=gl.getError();
   if(error){const entry={error,draw:report.totalDraws,material:material?.name??null,geometryVertices:geometry.attributes.position?.count,instances:object.isInstancedMesh?object.count:1,camera:camera.id};if(report.errors.length<24)report.errors.push(entry);console.info('GPU_SUBMISSION_ERROR '+JSON.stringify(entry));if(error===gl.OUT_OF_MEMORY||gl.isContextLost())throw Error('GPU submission failed with '+error+' at draw '+report.totalDraws+' ('+material?.name+')');}
  }
  return result;
 };
 console.info('GPU_SUBMISSION_BUDGET '+JSON.stringify({device,drawLimit,triangleLimit}));
}
