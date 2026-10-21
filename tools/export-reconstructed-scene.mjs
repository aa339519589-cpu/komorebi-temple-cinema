import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchRenderBrowser} from './render-runtime.mjs';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
import {encodeWebglPng} from './encode-webgl-png.mjs';
import {reconstructionSourceIdentity} from './reconstruction-source-identity.mjs';
const reference=Number(process.env.REFERENCE||6),id=String(reference).padStart(2,'0');
if(!Number.isInteger(reference)||reference<1||reference>10)throw Error('Invalid reference');
const out=process.env.SCENE_EXPORT||'output/pathtrace-reference-'+id;await mkdir(out+'/assets',{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),source=await reconstructionSourceIdentity(process.cwd(),id);
const report={status:'building',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source,sourceHash:source.hash,errors:[],newSceneConstruction:false,exportedAssets:{}};
const save=()=>writeFile(out+'/export-report.json',JSON.stringify(report,null,2));await save();
process.env.PORT=process.env.EXPORT_PORT||'4511';
const releaseGpu=await acquireGpuRenderSlot('export-real-geometry-'+id);
const serverModule=resolve(process.cwd(),'tools/server.mjs');
const {server}=await import(pathToFileURL(serverModule).href);let browser;
try{
 // The web root follows the requested checkout, even when this exporter is
 // launched by absolute path from another checkout. Compare the actual served
 // source bytes before associating any model buffers with a source receipt.
 const served=[];
 for(const [relative,expected] of Object.entries(source.files)){
  const url=`http://127.0.0.1:${process.env.PORT}/`+relative.split('/').map(encodeURIComponent).join('/');
  const response=await fetch(url);if(!response.ok)throw Error('Source server failed '+relative+' '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer()),actual=hash(bytes);
  if(actual!==expected)throw Error('Served source differs from requested checkout: '+relative);
  served.push({path:relative,sha256:actual});
 }
 report.servedSource={serverModule,root:process.cwd(),files:served,allMatch:true};await save();
 const runtime=await launchRenderBrowser();browser=runtime.browser;const page=await browser.newPage({viewport:{width:640,height:640}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>console.log(m.type(),m.text().slice(0,500)));
 await page.exposeFunction('saveSceneAsset',async(name,base64)=>{if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw Error('Invalid export filename');const bytes=Buffer.from(base64,'base64');await writeFile(out+'/assets/'+name,bytes);report.exportedAssets[name]={bytes:bytes.length,sha256:hash(bytes)};return name;});
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port===process.env.PORT)?route.continue():route.abort('blockedbyclient');});
 await page.goto(`http://127.0.0.1:${process.env.PORT}/reconstructions/scene-${id}/index.html?render&defer&w=640&h=640`,{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.temple?.ready,null,{timeout:300000});
 const manifest=await page.evaluate(async reference=>{
  const p=window.temple,{Vector3,Material}=await import('/vendor/build/three.module.js');p.renderReference(reference);
  const encode=array=>{const bytes=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);let str='';for(let i=0;i<bytes.length;i+=16384)str+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(str);};
  const gl=p.renderer.getContext();gl.finish();gl.bindFramebuffer(gl.FRAMEBUFFER,null);const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let nonzero=0;for(let i=0;i<pixels.length;i+=4)if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>3)nonzero++;
  if(gl.getError()||gl.isContextLost()||nonzero<width*height*.1)throw Error('Source framebuffer invalid; abort export.');
  await window.saveSceneAsset('source-frame.rgba',encode(pixels));
  const view={reference,position:p.camera.position.toArray(),fov:p.camera.fov},carving={scope:'Existing namespace geometry; no new objects added for export'};p.scene.updateMatrixWorld(true);
  const buffer=async(name,array)=>({file:await window.saveSceneAsset(name,encode(array)),type:array.constructor.name,count:array.length});
  const meshes=[],lights=[],excluded=[],geometries=new Map(),materials=new Map(),textures=new Map();
  p.scene.traverseVisible(o=>{if(o.isLight)lights.push(o);if(o.isMesh){if(o.isReflector||o.material?.isShaderMaterial||o.material?.visible===false){excluded.push({name:o.name,type:o.type,material:o.material?.name,reason:o.isReflector?'Planar approximation replaced by physical surface reflection in path tracer':'Non-PBR shader has no automatic portable equivalent'});return;}meshes.push(o);geometries.set(o.geometry.uuid,o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.set(m.uuid,m);for(const key of ['map','bumpMap','normalMap','roughnessMap','metalnessMap','alphaMap','emissiveMap'])if(m[key])textures.set(m[key].uuid,m[key]);}}});
  const output={format:'komorebi-source-buffers-v1',coordinateSystem:'Existing Three.js XYZ, Y-up; import matrices without reconstruction',view,cameraMatrix:p.camera.matrixWorld.toArray(),carving,geometries:[],materials:[],textures:[],meshes:[],lights:[],excluded,environmentIntensity:p.scene.environmentIntensity,renderingScope:{reference,geometry:'All currently visible geometry and exact instance matrices; no photograph or replacement geometry'},sourceFrame:{width,height,nonzero},limits:['Custom GLSL lighting and procedural shader hooks are not automatically portable. This export is for an independent physical-lighting diagnostic, not native WebGL pixel equivalence.']};
  let n=0;
  for(const [id,g] of geometries){const record={id,groups:g.groups,attributes:{}};for(const key of Object.keys(g.attributes)){const a=g.getAttribute(key);if(!a)continue;const values=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.getComponent(i,j);record.attributes[key]={...await buffer(`geometry-${n}-${key.replace(/[^a-zA-Z0-9_.-]/g,'_')}.bin`,values),itemSize:a.itemSize,sourceNormalized:!!a.normalized};}record.index=await buffer(`geometry-${n}-index.bin`,g.index?new Uint32Array(g.index.array):Uint32Array.from({length:g.attributes.position.count},(_,i)=>i));output.geometries.push(record);n++;}
  n=0;
  for(const [id,texture] of textures){const image=texture.image,record={id,repeat:texture.repeat.toArray(),offset:texture.offset.toArray(),rotation:texture.rotation,center:texture.center.toArray(),flipY:texture.flipY,colorSpace:texture.colorSpace};
   try{let canvas;if(image?.toDataURL)canvas=image;else if(image?.width&&image?.height){canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d');if(image.data){const data=new Uint8ClampedArray(image.width*image.height*4),channels=image.data.length/(image.width*image.height);for(let i=0;i<image.width*image.height;i++)for(let j=0;j<4;j++)data[i*4+j]=j<channels?image.data[i*channels+j]:255;c.putImageData(new ImageData(data,image.width,image.height),0,0);}else c.drawImage(image,0,0);}if(!canvas)throw Error('Unsupported image storage');record.file=await window.saveSceneAsset(`texture-${n}.png`,canvas.toDataURL('image/png').split(',')[1]);record.width=canvas.width;record.height=canvas.height;}catch(e){record.unexported=String(e);}output.textures.push(record);n++;
  }
  for(const [id,m] of materials){const record={id,name:m.name,type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity,roughness:m.roughness,metalness:m.metalness,opacity:m.opacity,transparent:m.transparent,alphaTest:m.alphaTest,side:m.side,bumpScale:m.bumpScale,normalScale:m.normalScale?.toArray(),transmission:m.transmission,ior:m.ior,clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness,specularIntensity:m.specularIntensity,specularColor:m.specularColor?.toArray(),vertexColors:m.vertexColors,textures:{}};for(const key of ['map','bumpMap','normalMap','roughnessMap','metalnessMap','alphaMap','emissiveMap'])if(m[key])record.textures[key]=m[key].uuid;output.materials.push(record);}
  n=0;for(const m of meshes){const record={name:m.name,geometry:m.geometry.uuid,materials:(Array.isArray(m.material)?m.material:[m.material]).map(x=>x.uuid),matrix:m.matrixWorld.toArray(),instances:m.isInstancedMesh?m.count:1,castShadow:m.castShadow,receiveShadow:m.receiveShadow};if(m.isInstancedMesh){record.instanceMatrices=await buffer(`instances-${n}.bin`,new Float32Array(m.instanceMatrix.array.slice(0,m.count*16)));if(m.instanceColor)record.instanceColors=await buffer(`instance-colors-${n}.bin`,new Float32Array(m.instanceColor.array.slice(0,m.count*3)));}output.meshes.push(record);n++;}
  for(const l of lights)output.lights.push({name:l.name,type:l.type,color:l.color.toArray(),intensity:l.intensity,matrix:l.matrixWorld.toArray(),target:l.target?.getWorldPosition(new Vector3()).toArray(),width:l.width,height:l.height,angle:l.angle,penumbra:l.penumbra,distance:l.distance,decay:l.decay});
  output.statistics={meshes:output.meshes.length,geometries:output.geometries.length,materials:output.materials.length,textures:output.textures.length,instances:output.meshes.reduce((s,m)=>s+m.instances,0),triangles:output.meshes.reduce((s,m)=>s+output.geometries.find(g=>g.id===m.geometry).index.count/3*m.instances,0)};return output;
 },reference);
 const raw=await readFile(out+'/assets/source-frame.rgba');await writeFile(out+'/assets/source-frame.png',encodeWebglPng(manifest.sourceFrame.width,manifest.sourceFrame.height,raw));
 if((await reconstructionSourceIdentity(process.cwd(),id)).hash!==source.hash)throw Error('Scene source or a declared binary asset changed during export.');
 await writeFile(out+'/scene.json',JSON.stringify(manifest));report.statistics=manifest.statistics;report.exclusions=manifest.excluded;report.status='exported-existing-geometry';report.reference=reference;report.nativePixelEquivalenceClaimed=false;if(report.errors.length)throw Error(report.errors.join('\n'));
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{await save();console.log(JSON.stringify({status:report.status,statistics:report.statistics,error:report.error}));if(browser)await browser.close().catch(()=>{});server.close();releaseGpu();}
