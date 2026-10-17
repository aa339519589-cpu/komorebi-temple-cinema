import * as T from 'three';
import {foliageNormalMaterial} from './botany.js';
import {referenceExteriorPlan} from './restoration-landscape-layout.js';

// Replaces ONLY the legacy six islands' low leaf/fern loops. Existing mound,
// perimeter rocks, trees and lanterns remain. All roots use the actual mound fan.
const TAU=Math.PI*2,rng=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
const v=(x,y,z)=>new T.Vector3(x,y,z);
export function restorationIslandSurface(island,x,z,scale=.6){
  const qx=(x-island.x)/island.radiusX,qz=(z-island.z)/island.radiusZ,r=Math.hypot(qx,qz);
  if(r<1e-12)return{fraction:0,y:.5*scale,inside:true};
  const a=(Math.atan2(qz,qx)+TAU)%TAU,k=Math.floor(a/TAU*64),a0=k/64*TAU,a1=(k+1)/64*TAU;
  const ra=1+.1*Math.sin(a0*5),rb=1+.1*Math.sin(a1*5),ax=Math.cos(a0)*ra,az=Math.sin(a0)*ra,bx=Math.cos(a1)*rb,bz=Math.sin(a1)*rb;
  const dx=qx/r,dz=qz/r,ex=bx-ax,ez=bz-az,edge=(ax*ez-az*ex)/(dx*ez-dz*ex),fraction=r/edge;
  return{fraction,y:(.5-.73*fraction)*scale,inside:fraction<=1};
}
function lamina(seed=1,sword=false){
  const rows=sword?14:9,cols=2,p=[0,0,0],uv=[.5,0],ids=[];
  for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++){
    const t=j/rows,u=i/cols*2-1,width=(sword?.037:.22)*Math.pow(Math.sin(Math.PI*t),sword?.55:.72);
    const y=sword?-.15*t*t+.025*(1-u*u)*Math.sin(Math.PI*t):.028*Math.sin(Math.PI*t)+.015*u*Math.sin(t*4+seed);
    p.push(u*width,y,t);uv.push(i/cols,t);
  }
  const tip=p.length/3;p.push(0,sword?-.15:0,1);uv.push(.5,1);
  for(let i=0;i<cols;i++)ids.push(0,1+i,2+i);
  for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){const k=1+j*(cols+1)+i;ids.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)ids.push(last+i,tip,last+i+1);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
function azaleaCorolla(){
  const p=[],uv=[],ids=[];
  for(let k=0;k<5;k++){
    const a=k/5*TAU,base=p.length/3;
    const outline=[[0,0,.055],[-.115,.055,.12],[-.22,.04,.31],[-.18,.025,.46],[0,.05,.50],[.18,.025,.46],[.22,.04,.31],[.115,.055,.12]];
    p.push(Math.sin(a)*.26,.075,Math.cos(a)*.26);uv.push(.5,.5);
    for(const[x,y,z]of outline){p.push(x*Math.cos(a)+z*Math.sin(a),y,z*Math.cos(a)-x*Math.sin(a));uv.push(.5+x,.5+z);}
    for(let j=0;j<8;j++)ids.push(base,base+1+j,base+1+(j+1)%8);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
export function buildRestorationIslandPlanting({materials:source={},islands=referenceExteriorPlan.islands,options={}}={}){
  const started=performance.now(),random=rng(options.seed??5101626),rr=(a,b)=>a+(b-a)*random(),scale=options.moundScale??referenceExteriorPlan.scale;
  const exclusions=options.exclusions??referenceExteriorPlan.lanterns.map(([x,y,z,s])=>({x,z,radius:.57*s}));
  const group=new T.Group();group.name='six-existing-islands-reference-understory';const groups=islands.map((_,i)=>{const g=new T.Group();g.name=`original-island-${i+1}-understory`;group.add(g);return g;});
  const materials={wood:new T.MeshStandardMaterial({name:'island-shrub-small-branches',color:'#665949',roughness:.91}),leaf:new T.MeshStandardMaterial({name:'island-evergreen-thin-leaf',color:'#566e3b',roughness:.79,side:T.DoubleSide}),fern:new T.MeshStandardMaterial({name:'island-pinnate-fern-leaf',color:'#476d3b',roughness:.83,side:T.DoubleSide}),iris:new T.MeshStandardMaterial({name:'island-iris-sword-leaf',color:'#456b39',roughness:.75,side:T.DoubleSide}),flower:new T.MeshStandardMaterial({name:'island-five-lobed-azalea-corolla',color:'#d68aab',roughness:.83,side:T.DoubleSide})};
  if(source.bark){materials.wood.dispose();materials.wood=source.bark.clone();materials.wood.name='island-shrub-small-branches';}
  const leaf=lamina(2),fernLeaf=lamina(5),sword=lamina(3,true),flower=azaleaCorolla(),cylinder=new T.CylinderGeometry(1,1,1,6,1,false),geometries=[leaf,fernLeaf,sword,flower,cylinder];
  const buckets=new Map(),dummy=new T.Object3D(),color=new T.Color(),up=v(0,1,0),placements=[],foliageMeshes=[],normalMeshes=[];let islandIndex=0;
  function emit(g,mat,p,s,rotation,shade=1){const key=islandIndex+'/'+g.uuid+'/'+mat;if(!buckets.has(key))buckets.set(key,{g,mat,islandIndex,items:[]});dummy.position.fromArray(p);dummy.scale.fromArray(s);if(rotation?.isQuaternion)dummy.quaternion.copy(rotation);else dummy.rotation.set(...(rotation??[0,0,0]));dummy.updateMatrix();buckets.get(key).items.push({matrix:dummy.matrix.clone(),shade});}
  function branch(a,b,r){const av=v(...a),bv=v(...b),delta=bv.clone().sub(av),mid=av.clone().add(bv).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(up,delta.clone().normalize());emit(cylinder,'wood',mid.toArray(),[r,delta.length(),r],q,rr(.83,1.08));}
  function safeShrubSpread(island,a,r,requested){const x=island.x+Math.cos(a)*island.radiusX*r,z=island.z+Math.sin(a)*island.radiusZ*r;let safe=requested;for(const e of exclusions)safe=Math.min(safe,(Math.hypot(x-e.x,z-e.z)-e.radius-.10)/1.32);return safe;}
  function root(island,a,r,species,height,spread){const x=island.x+Math.cos(a)*island.radiusX*r,z=island.z+Math.sin(a)*island.radiusZ*r,surface=restorationIslandSurface(island,x,z,scale);const p=[x,surface.y+.006,z];placements.push({islandIndex,species,origin:p,height,spread,surfaceFraction:surface.fraction});return p;}
  function shrub(p,height,spread,bloom){
    for(let b=0;b<8;b++){
      const a=b*2.39996+rr(-.15,.15),reach=spread*rr(.65,1),end=[p[0]+Math.sin(a)*reach,p[1]+height*rr(.65,1),p[2]+Math.cos(a)*reach],fork=[p[0]+Math.sin(a)*reach*.38,p[1]+height*.54,p[2]+Math.cos(a)*reach*.38];branch(p,fork,height*.014);branch(fork,end,height*.007);
      for(let twig=0;twig<3;twig++){
        const t=.45+twig*.25,base=fork.map((c,k)=>c+(end[k]-c)*t),aa=a+(twig-1)*.83,tip=[base[0]+Math.sin(aa)*spread*.32,base[1]+height*.10,base[2]+Math.cos(aa)*spread*.32];branch(base,tip,.0025);
        for(let j=0;j<7;j++){const u=j/7,anchor=base.map((c,k)=>c+(tip[k]-c)*u),size=rr(.044,.082);for(const side of[-1,1])emit(leaf,'leaf',anchor,[size*.85,size,size],[rr(-.4,.18),aa+side*1.0,side*.14],rr(.78,1.16));}
        if(bloom&&twig===2){const size=rr(.045,.065);emit(flower,'flower',tip,[size,size,size],[rr(-.2,.4),rr(0,TAU),rr(-.2,.2)],rr(.88,1.07));}
      }
    }
  }
  function fern(p,height,spread){for(let b=0;b<7;b++){const a=b*2.39996,reach=spread*rr(.8,1);for(let j=1;j<=9;j++){const t=j/10,anchor=[p[0]+Math.sin(a)*reach*t,p[1]+height*Math.sin(t*Math.PI*.82),p[2]+Math.cos(a)*reach*t],length=(.11-.085*t)*(spread/.4);for(const side of[-1,1])emit(fernLeaf,'fern',anchor,[length*.65,length,length],[-.12,a+side*.9,side*.08],rr(.80,1.15));if(j<9){const tn=(j+1)/10;branch(anchor,[p[0]+Math.sin(a)*reach*tn,p[1]+height*Math.sin(tn*Math.PI*.82),p[2]+Math.cos(a)*reach*tn],.0015);}}}}
  function iris(p,height){for(let j=0;j<9;j++){const a=j*2.39996,length=height*rr(.70,1);const tilt=-Math.PI/2+rr(.10,.36),roll=rr(-.08,.08),q=new T.Quaternion().setFromAxisAngle(up,a).multiply(new T.Quaternion().setFromAxisAngle(v(1,0,0),tilt)).multiply(new T.Quaternion().setFromAxisAngle(v(0,0,1),roll));emit(sword,'iris',[p[0]+Math.sin(a)*.025,p[1],p[2]+Math.cos(a)*.025],[length,length,length],q,rr(.85,1.13));}}
  islands.forEach((island,i)=>{islandIndex=i;const area=Math.PI*island.radiusX*island.radiusZ,shrubs=Math.max(3,Math.min(6,Math.round(area/6))),yaw=i*.73;
    for(let j=0;j<shrubs;j++){const a=yaw+j/shrubs*TAU,r=rr(.48,.67),height=rr(.38,.65),spread=safeShrubSpread(island,a,r,Math.min(island.radiusX,island.radiusZ)*rr(.14,.22));if(spread<.095)continue;const p=root(island,a,r,j%3===0?'low-azalea':'evergreen-shrub',height,spread);shrub(p,height,spread,j%3===0);}
    for(let j=0;j<3;j++){const a=yaw+j/3*TAU+.55,p=root(island,a,.70,'pinnate-fern',.26,.33);fern(p,rr(.22,.30),rr(.27,.37));}
    for(let j=0;j<2;j++){const a=yaw+j*Math.PI+1.1,h=rr(.48,.68),p=root(island,a,.58,'iris-like-sword-leaf',h,.17);iris(p,h);}
  });
  for(const b of buckets.values()){const m=new T.InstancedMesh(b.g,materials[b.mat],b.items.length);m.name=`island-${b.islandIndex+1}-${b.mat}`;b.items.forEach((item,i)=>{m.setMatrixAt(i,item.matrix);m.setColorAt(i,color.setRGB(item.shade,item.shade,item.shade));});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;m.computeBoundingSphere();groups[b.islandIndex].add(m);}
  group.updateMatrixWorld(true);const stats={version:'six-island-understory-v1',meshes:0,instances:0,triangles:0,plantRoots:placements.length,buildMilliseconds:performance.now()-started};
  group.traverse(m=>{if(!m.isMesh)return;stats.meshes++;stats.instances+=m.count;stats.triangles+=m.geometry.index.count/3*m.count;if(m.material.side===T.DoubleSide){foliageMeshes.push(m);const n=new T.InstancedMesh(m.geometry,foliageNormalMaterial(m.material),m.count);n.instanceMatrix=m.instanceMatrix;n.instanceColor=m.instanceColor;n.matrix.copy(m.matrixWorld);n.matrixAutoUpdate=false;n.boundingSphere=m.boundingSphere;normalMeshes.push(n);}});
  return{group,groups,materials,stats,placements,foliageMeshes,normalMeshes,bounds:new T.Box3().setFromObject(group),
    integration:{worldCoordinates:true,transformAgain:false,replaces:'only six-island 100-leaf/fern loop, not mound/rocks/tree/lantern',worldRandomDraws:0,oldDrawsPerIsland:2055},
    dispose(){geometries.forEach(g=>g.dispose());Object.values(materials).forEach(m=>m.dispose());normalMeshes.forEach(m=>m.material.dispose());group.removeFromParent();}};
}
