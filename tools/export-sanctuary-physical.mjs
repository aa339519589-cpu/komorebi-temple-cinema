import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const out='output/physical-export';await mkdir(out,{recursive:true});
const request=JSON.parse(await readFile('tools/detail-request.json','utf8')),job=request.jobs[0];
const upload=createServer(async(req,res)=>{try{if(req.method!=='POST'||!/^\/[a-z0-9-]+\.(bin|png|json)$/.test(req.url))throw Error('Invalid export path');let size=0;const chunks=[];for await(const b of req){size+=b.length;if(size>180*1024*1024)throw Error('Buffer too large');chunks.push(b);}await writeFile(join(out,req.url.slice(1)),Buffer.concat(chunks));res.writeHead(200,{'access-control-allow-origin':'http://127.0.0.1:4317'});res.end('ok');}catch(e){res.writeHead(400,{'access-control-allow-origin':'http://127.0.0.1:4317'});res.end(String(e));}});
await new Promise(resolve=>upload.listen(4319,'127.0.0.1',resolve));
const {server}=await import('./server.mjs');const spec=process.env.PLAYWRIGHT_MODULE;const {chromium}=await import(pathToFileURL(spec).href);let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog']});
 const page=await browser.newPage({viewport:{width:640,height:640}});page.on('pageerror',e=>console.error(e));
 await page.goto('http://127.0.0.1:4317/sanctuary-detail.html?w=640&h=640&scope=interior',{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 const report=await page.evaluate(async({job})=>{
  const p=window.production,T=p.T;p.renderer.resetState=()=>{};p.configure(job.config);const pose=job.camera||p.getReferenceView(6);p.render(pose);p.scene.updateMatrixWorld(true);
  const post=async(name,data)=>{const r=await fetch('http://127.0.0.1:4319/'+name,{method:'POST',body:data});if(!r.ok)throw Error(await r.text());};
  const geometryMap=new Map(),materialMap=new Map(),textureMap=new Map(),geometries=[],materials=[],meshes=[],lights=[],textures=[],omitted=[];
  async function texture(t){
   if(!t?.image)return null;if(textureMap.has(t.uuid))return textureMap.get(t.uuid);const id='texture-'+textureMap.size;textureMap.set(t.uuid,id);
   const image=t.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   if(!(canvas.width>0&&canvas.height>0&&canvas.width<=8192&&canvas.height<=8192)){omitted.push({texture:t.name,reason:'non-raster texture'});return null;}
   const ctx=canvas.getContext('2d');
   try{if(image.data){if(!(image.data instanceof Uint8Array||image.data instanceof Uint8ClampedArray)||image.data.length!==canvas.width*canvas.height*4)throw Error('non-byte RGBA texture');ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data),canvas.width,canvas.height),0,0);}else ctx.drawImage(image,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('No raster texture');await post(id+'.png',blob);textures.push({id,name:t.name,colorSpace:t.colorSpace,flipY:t.flipY,repeat:t.repeat.toArray(),offset:t.offset.toArray(),rotation:t.rotation});return id;}catch(e){omitted.push({texture:t.name,reason:String(e)});return null;}
  }
  async function material(m){
   if(materialMap.has(m.uuid))return materialMap.get(m.uuid);const id=materials.length;materialMap.set(m.uuid,id);
   const record={id,name:m.name,type:m.type,color:m.color?.toArray()||[.15,.12,.08],metalness:m.metalness||0,roughness:m.roughness??.5,opacity:m.opacity??1,transparent:m.transparent,transmission:m.transmission||0,ior:m.ior||1.5,emissive:m.emissive?.toArray()||[0,0,0],emissiveIntensity:m.emissiveIntensity??0,clearcoat:m.clearcoat||0,alphaTest:m.alphaTest||0,shaderAdaptation:!!m.onBeforeCompile};materials.push(record);
   record.map=await texture(m.map);record.bump=await texture(m.bumpMap);record.bumpScale=m.bumpScale||0;record.normal=await texture(m.normalMap);return id;
  }
  async function geometry(g){
   if(geometryMap.has(g.uuid))return geometryMap.get(g.uuid);const id='geometry-'+geometryMap.size;geometryMap.set(g.uuid,id);const attributes={},parts=[];let offset=0;
   for(const [name,n]of [['position',3],['normal',3],['uv',2]]){const a=g.getAttribute(name);if(!a)continue;const arr=new Float32Array(a.count*n);for(let i=0;i<a.count;i++){arr[i*n]=a.getX(i);arr[i*n+1]=a.getY(i);if(n===3)arr[i*n+2]=a.getZ(i);}attributes[name]={offset,bytes:arr.byteLength,count:a.count,itemSize:n};parts.push(new Uint8Array(arr.buffer));offset+=arr.byteLength;}
   const count=g.index?.count||g.attributes.position.count,index=new Uint32Array(count);for(let i=0;i<count;i++)index[i]=g.index?g.index.getX(i):i;attributes.index={offset,bytes:index.byteLength,count,itemSize:1};parts.push(new Uint8Array(index.buffer));offset+=index.byteLength;
   const buffer=new Uint8Array(offset);let at=0;for(const b of parts){buffer.set(b,at);at+=b.length;}await post(id+'.bin',buffer);
   geometries.push({id,name:g.name,attributes,groups:g.groups,drawRange:{start:g.drawRange.start,count:Number.isFinite(g.drawRange.count)?g.drawRange.count:count}});return id;
  }
  const visible=[];p.scene.traverseVisible(o=>{if(o.isMesh)visible.push(o);if(o.isLight){const pos=o.getWorldPosition(new T.Vector3());lights.push({name:o.name,type:o.type,color:o.color.toArray(),intensity:o.intensity,position:pos.toArray(),matrix:o.matrixWorld.toArray(),target:o.target?.getWorldPosition(new T.Vector3()).toArray(),width:o.width,height:o.height,angle:o.angle,penumbra:o.penumbra,distance:o.distance,castShadow:o.castShadow});}});
  for(const o of visible){if(o.isReflector){omitted.push({object:o.name,reason:'Planar reflector is a raster technique; path-traced floor reflections replace it.'});continue;}if(o.geometry?.attributes?.position==null)continue;
   const gid=await geometry(o.geometry),mats=[];for(const m of Array.isArray(o.material)?o.material:[o.material])mats.push(await material(m));
   const id='mesh-'+meshes.length,count=o.isInstancedMesh?o.count:1,transforms=new Float32Array(count*16),colors=o.instanceColor?new Float32Array(count*3):null,local=new T.Matrix4(),world=new T.Matrix4();
   for(let i=0;i<count;i++){if(o.isInstancedMesh){o.getMatrixAt(i,local);world.multiplyMatrices(o.matrixWorld,local);}else world.copy(o.matrixWorld);transforms.set(world.elements,i*16);if(colors){colors.set([o.instanceColor.getX(i),o.instanceColor.getY(i),o.instanceColor.getZ(i)],i*3);}}
   await post(id+'.bin',transforms);if(colors)await post(id+'-colors.bin',colors);
   meshes.push({id,name:o.name,geometry:gid,materials:mats,count,colors:!!colors,castShadow:o.castShadow,receiveShadow:o.receiveShadow});
  }
  const manifest={format:'KOMOREBI-native-geometry-v1',source:'Unchanged live Three.js model + explicitly added reference6 carvings',camera:pose,geometries,materials,meshes,lights,textures,omitted,renderInfo:p.info(),photoPixelsInScene:false};
  await post('scene.json',JSON.stringify(manifest));return{meshGroups:meshes.length,instances:meshes.reduce((s,m)=>s+m.count,0),geometries:geometries.length,materials:materials.length,textures:textures.length,omitted,camera:pose,glError:p.renderer.getContext().getError()};
 },{job});
 await writeFile(out+'/export-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(report.glError)throw Error('Source GPU reported an error');
}catch(e){await writeFile(out+'/export-error.json',JSON.stringify({error:String(e.stack||e)}));throw e;}finally{if(browser)await browser.close().catch(()=>{});server.close();upload.close();}
