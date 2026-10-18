import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRestorationArchitecture} from './architecture.js';
import {createReference4MaterialSet} from './materials.js';
export const POSE={position:[7.5,1.02,10],target:[-1.2,8.4,0],fov:65};
export function buildScene(){
 const scene=new T.Scene();scene.background=new T.Color('#79b8f2');
 const materialSet=createReference4MaterialSet(T),mats=materialSet.mats;
 mats.red.color.set('#9d3f20');mats.cedar.color.set('#985430');mats.endwood.color.set('#c28545');
 mats.slate.color.set('#434c51');mats.tileEdge.color.set('#a3a69f');mats.darkwood.color.set('#342e26');
 mats.gold.color.set('#e1af46');mats.oldgold.color.set('#c79a43');
 mats.gold.roughness=.40;mats.oldgold.roughness=.48;
 // All surfaces are geometry and procedural textures. Baked source photographs are never used.
 const stack=[new T.Matrix4()],bucket=new Map(),geometryCache=new Map(),columns=[];
 const primitive={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,16,10),cone:new T.ConeGeometry(1,1,16)};
 function instance(geo,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=null,tint=1){
   if(typeof geo==='string')geo=primitive[geo];if(!geo)throw Error('Unknown geometry');
   let material=mats[mat];if(!material)throw Error('Unknown material '+mat);
   const quaternion=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...(Array.isArray(rot)?rot:[0,0,0])));
   const matrix=stack.at(-1).clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),quaternion,new T.Vector3(sx,sy,sz)));
   if(!bucket.has(material))bucket.set(material,[]);bucket.get(material).push({geo,matrix,tint});
 }
 function group(x,y,z,angle,fn){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationY(angle)));try{fn();}finally{stack.pop();}}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){instance('box',ma,x,y,z,w,h,d,[0,rot,0],tint);}
 const arch=createRestorationArchitecture({instance,group,box,materials:mats,columns,stack});
 mats.architecture_red.color.set('#a04727');mats.architecture_cedar.color.set('#a36137');mats.architecture_endwood.color.set('#b47538');mats.architecture_slate.color.set('#414c53');mats.architecture_tileEdge.color.set('#a9aca4');mats.architecture_gold.color.set('#e8b84f');mats.architecture_oldgold.color.set('#c99c4e');
 // Lower story begins at 0.35 m; the low camera sees an architectural tower continuing beyond the top crop.
 const levels=[];
 for(let level=0;level<5;level++){
   const scale=1-level*.075,w=8.8*scale,y=.35+level*4.3;
   box(0,y+.15,0,w+.5,.30,w+.5,'darkwood');
   const frame=arch.pagodaStoreyFrame({w,d:w,y,level,scale,roofWidth:w+3.5*scale,roofDepth:w+3.5*scale,roofRise:2.35*scale,roofY:y+3.55,windowMaterial:'paper',detail:true});
   arch.pagodaRoof({y:y+3.55,w:w+3.5*scale,d:w+3.5*scale,rise:2.35*scale,wallWidth:w,wallDepth:w,frameScale:scale,detail:true,soffitMaterial:'cedar'});
   levels.push({level,y,width:w,shaftTop:frame.shaftTop});
   balcony(w,y,scale);
   // Four identical suspended lanterns, each is fixed to the outer hip beam.
   const r=(w+3.5*scale)/2;
   for(const sx of [-1,1])for(const sz of [-1,1])lantern(sx*r*.965,y+3.18,sz*r*.965,.68*scale);
   // Flanking upper ties and chased metal straps on the visible actual member ends.
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     for(let k=-1;k<=1;k++){
       const x=k*w/3;box(x,y+2.65,w/2+.026,w/3-.22,.26,.16,'red');
       arch.squareFitting(x,y+2.65,w/2+.114,.15,.15,0,true);
     }
   });
 }
 function balcony(w,y,s){
   const d=w+.72,base=y+.29,top=base+.82;
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     box(0,base,d/2,d+.10,.15,.22,'red');box(0,base+.43,d/2,d+.10,.10,.14,'red');box(0,top,d/2,d+.18,.135,.19,'red');
     for(let i=0;i<=6;i++){
       const x=-d/2+i*d/6;box(x,(top+base)/2,d/2,.105,.95,.105,'red');
       if(i%2===0){instance('sphere','gold',x,top+.10,d/2,.083,.11,.083);arch.squareFitting(x,top-.09,d/2+.099,.085,.085,0,true);}
     }
   });
 }
 function lantern(x,y,z,s){
   group(x,y,z,0,()=>{
     const metal='oldgold',radius=.34*s,h=.72*s;
     
     // Lofted six sided metal hoods and perforated crown are closed geometry.
     function loft(profile,ma){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0]*s,p[1]*s)),6);instance(g,ma);}
     loft([[0,-.66],[.07,-.64],[.12,-.57],[.08,-.51],[.19,-.43],[.27,-.36],[.34,-.36],[.34,.36],[.48,.39],[.44,.48],[.34,.47],[.16,.64],[.11,.70],[.11,.94],[.20,1.02],[.17,1.22],[.07,1.27],[0,1.27]],metal);
     // Paper faces sit just outside the hollow frame; bars cast true minute shadows.
     for(let face=0;face<6;face++)group(0,0,0,face*Math.PI/3,()=>{
       box(0,0,.296*s,.31*s,.66*s,.012*s,'paper');
       for(const side of [-1,1])box(side*.165*s,0,.309*s,.025*s,.73*s,.035*s,'black');
       for(const yy of [-.34,0,.34])box(0,yy*s,.316*s,.35*s,.018*s,.027*s,'oldgold');
       for(const side of [-1,1])box(side*.085*s,0,.318*s,.014*s,.66*s,.016*s,'oldgold');
       // Small raised floral reliefs decorate the copper upper crown.
       arch.squareFitting(0,.97*s,.147*s,.18*s,.18*s,0,true);
     });
     instance(new T.CylinderGeometry(.018*s,.018*s,.38*s,8),'oldgold',0,1.44*s,0);
     for(let i=0;i<6;i++){
       const a=i*Math.PI/3;instance('sphere','gold',Math.sin(a)*.10*s,-.62*s,Math.cos(a)*.10*s,.033*s,.042*s,.033*s);
     }
   });
 }
 // Sky: directional pale wisps are an analytic shader, with no image texture.
 const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDir;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,91.3)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 d=normalize(vDir);vec3 c=mix(vec3(.70,.83,.96),vec3(.22,.51,.88),pow(max(0.,d.y),.4));vec3 p=d*9.;float n=noise(p)+.5*noise(p*2.1)+.24*noise(p*4.4);float cloud=smoothstep(.98,1.25,n)*smoothstep(0.,.2,d.y);c=mix(c,vec3(1.),cloud*.92);gl_FragColor=vec4(c,1.);}`});
 const sky=new T.Mesh(new T.SphereGeometry(120,32,16),skyMaterial);scene.add(sky);
 const hemi=new T.HemisphereLight('#cce5ff','#76522d',2.0);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff0ce',4.3);sun.position.set(-18,30,23);sun.target.position.set(0,9,0);sun.castShadow=true;
 sun.shadow.mapSize.set(3072,3072);Object.assign(sun.shadow.camera,{left:-17,right:17,top:24,bottom:-12,near:1,far:85});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.radius=1.5;scene.add(sun,sun.target);
 // Procedural environment radiance provides directional metal reflections.
 const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=64;const cx=c.getContext('2d'),gr=cx.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#c7defa');gr.addColorStop(.5,'#b4c2c2');gr.addColorStop(1,'#6b4b2c');cx.fillStyle=gr;cx.fillRect(0,0,64,64);faces.push(c);}
 const env=new T.CubeTexture(faces);env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;scene.environment=env;scene.environmentIntensity=.55;
 foliage();
 function foliage(){
   let seed=52;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const bark=new T.MeshStandardMaterial({color:'#443923',roughness:1}),greens=['#7b7c17','#9d9b1b','#b6a92a','#53601b','#718128'].map(color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.89}));
   const maple=new T.Shape();const outline=[[0,.53],[.10,.22],[.25,.34],[.20,.12],[.45,.14],[.30,-.035],[.47,-.10],[.22,-.16],[.20,-.32],[.07,-.19],[0,-.44],[-.07,-.19],[-.20,-.32],[-.22,-.16],[-.47,-.10],[-.30,-.035],[-.45,.14],[-.20,.12],[-.25,.34],[-.10,.22]];outline.forEach(([x,y],i)=>i?maple.lineTo(x,y):maple.moveTo(x,y));maple.closePath();const leafGeo=new T.ShapeGeometry(maple);const pp=leafGeo.attributes.position;for(let i=0;i<pp.count;i++)pp.setZ(i,.08*Math.abs(pp.getX(i))+.026*Math.sin(pp.getY(i)*10));leafGeo.computeVertexNormals();
   function branch(a,b,r){const av=new T.Vector3(...a),bv=new T.Vector3(...b),dir=bv.clone().sub(av),g=new T.CylinderGeometry(r*.62,r,dir.length(),7);const mesh=new T.Mesh(g,bark);mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;scene.add(mesh);}
   // Left foreground branch canopy. Individual lobed leaves keep natural open sky gaps.
   const leafBatches=greens.map(()=>[]);
   function spray(anchor,spread,count){for(let i=0;i<count;i++){
     const p=new T.Vector3(anchor[0]+(rand()-.5)*spread,anchor[1]+(rand()-.5)*spread*.55,anchor[2]+(rand()-.5)*spread*.8);
     const s=.17+rand()*.22,q=new T.Quaternion().setFromEuler(new T.Euler(-.25+rand()*1.8,rand()*6.28,rand()*6.28));leafBatches[Math.floor(rand()*greens.length)].push(new T.Matrix4().compose(p,q,new T.Vector3(s,s,s)));
   }}
   branch([-9,0,10],[-7,7.7,8],.24);branch([-7,7.7,8],[-4.8,10.8,7],.13);branch([-4.8,10.8,7],[.2,11.1,8],.075);
   for(let j=0;j<15;j++){
     const a=[-8+j*.48,9.7+Math.sin(j*.8)*1.1,7.6+Math.sin(j)*1.1],b=[a[0]+.5,a[1]+.6,a[2]+.25];branch(a,b,.027);spray(b,1.7,100);
   }
   for(let j=0;j<26;j++){const p=[-10+rand()*7,1+rand()*7,2+rand()*5];spray(p,2.8,65);}
   leafBatches.forEach((arr,j)=>{const mesh=new T.InstancedMesh(leafGeo,greens[j],arr.length);arr.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);});
 }
 // Flatten static geometry by material: dense joinery remains real 3D but submission cost stays bounded.
 let triangles=0,parts=0;
 for(const [material,records]of bucket){
   const pieces=records.map(({geo,matrix,tint})=>{
     const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(matrix);
     for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);
     const n=g.attributes.position.count;if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
     return g;
   });
   const geo=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geo)throw Error('Unable to merge '+material.name);
   const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);triangles+=geo.attributes.position.count/3;parts+=records.length;
 }
 return {scene,info:()=>({reference:5,revision:'scene05-low-angle-v1',levels,triangles,parts,geometry:'True 3D four-sided joinery, ceramic rows, gilded metal fittings, lanterns, individual lobed leaves',cameraHeightRange:[.72,1.02]}),dispose(){scene.traverse(o=>{o.geometry?.dispose();});Object.values(mats).forEach(m=>m.dispose());env.dispose();skyMaterial.dispose();}};
}
