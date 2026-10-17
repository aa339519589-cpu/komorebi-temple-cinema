import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {foliageNormalMaterial} from './botany.js';
import {referenceExteriorPlan} from './restoration-landscape-layout.js';
import {restorationIslandSurface} from './restoration-island-planting.js';

// The pale flowering branch layer visible at left in ref3 and both sides in
// ref4 is missing from the old maple/pine-only garden. Explicit replacement
// only: the ref3 wrapper replaces the old LEFT maple, never adds another tree.
const TAU=Math.PI*2,rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function branch(points,radius,segments=10){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(path,segments,radius,6,false),p=g.attributes.position;
  for(let j=0;j<=segments;j++){const t=j/segments,c=path.getPointAt(t),f=.20+.80*Math.pow(1-t,.8);for(let k=0;k<=6;k++){const i=j*7+k;p.setXYZ(i,c.x+(p.getX(i)-c.x)*f,c.y+(p.getY(i)-c.y)*f,c.z+(p.getZ(i)-c.z)*f);}}
  g.computeVertexNormals();g.userData.restorationCenterline=path;return g;
}
function pointAtHeight(path,y){let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(path.getPoint(mid).y<y)lo=mid;else hi=mid;}return path.getPoint((lo+hi)/2).toArray();}
function blossomGeometry(){
  const p=[],uv=[],ids=[];
  // Five rounded, shallowly notched petals with concave bases, not lotus petals.
  for(let k=0;k<5;k++){
    const a=k/5*TAU,c=Math.cos(a),s=Math.sin(a),base=p.length/3;
    const outline=[[0,.055,.075],[-.115,.050,.18],[-.155,.025,.35],[-.096,.035,.49],[0,.031,.462],[.096,.035,.49],[.155,.025,.35],[.115,.050,.18]];
    p.push(Math.sin(a)*.25,.018,Math.cos(a)*.25);uv.push(.5,.6);
    for(const[x,y,z]of outline){p.push(x*c+z*s,y,z*c-x*s);uv.push(x+.5,z*1.8);}
    for(let j=0;j<outline.length;j++)ids.push(base,base+1+j,base+1+(j+1)%outline.length);
  }
  // Central warm-pink disk is geometry with a different vertex tint, not glow.
  const base=p.length/3;p.push(0,.044,0);uv.push(.5,.02);
  for(let i=0;i<10;i++){const a=i/10*TAU;p.push(Math.sin(a)*.085,.039,Math.cos(a)*.085);uv.push(.5,.04);}
  for(let i=0;i<10;i++)ids.push(base,base+1+i,base+1+(i+1)%10);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
function smallLeafGeometry(){
  const p=[0,0,0],uv=[.5,0],ids=[],rows=10;
  // One shared base/tip, two half-laminae and a lifted midrib. No overlapping
  // cone, collapsed rectangular end rows or opaque canopy proxy.
  for(let j=1;j<rows;j++)for(let k=0;k<3;k++){const t=j/rows,u=k-1,w=.23*Math.pow(Math.sin(Math.PI*t),.8)*(1+.035*Math.sin(t*28));p.push(u*w,.06*Math.sin(Math.PI*t)-.045*Math.abs(u)*Math.sin(Math.PI*t),t);uv.push(k/2,t);}
  const tip=p.length/3;p.push(0,0,1);uv.push(.5,1);
  ids.push(0,1,2,0,2,3);
  for(let j=0;j<rows-2;j++)for(let k=0;k<2;k++){const a=1+j*3+k;ids.push(a,a+3,a+1,a+1,a+3,a+4);}
  const last=1+(rows-2)*3;ids.push(last,tip,last+1,last+1,tip,last+2);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
function petalMap(){
  const n=64,data=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const t=y/(n-1),i=(y*n+x)*4,f=.985+.015*Math.sin(x*.56+y*.10);data[i]=Math.round((210+31*t)*f);data[i+1]=Math.round((132+76*t)*f);data[i+2]=Math.round((156+65*t)*f);data[i+3]=255;}
  const t=new T.DataTexture(data,n,n,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function buildRestorationFloweringTree({materials:source={},options={}}={}){
  const started=performance.now(),height=options.height??7.2,spread=options.spread??4.6,random=rng(options.seed??341016),rr=(a,b)=>a+(b-a)*random();
  if(!(height>0&&spread>0))throw Error('Flowering tree height/spread must be positive.');
  const group=new T.Group();group.name='reference3-4-flowering-branch-tree-replacement';group.position.fromArray(options.origin??[0,0,0]);group.rotation.y=options.yaw??0;
  const bark=source.bark?source.bark.clone():new T.MeshStandardMaterial({color:'#594e43',roughness:.94});bark.name='aged-flowering-tree-bark';
  const texture=petalMap(),petal=new T.MeshStandardMaterial({name:'pale-pink-five-petal-blossom',map:texture,color:'#fff9f5',roughness:.82,side:T.DoubleSide}),leaf=new T.MeshStandardMaterial({name:'sparse-small-flowering-tree-leaves',color:'#6f7950',roughness:.80,side:T.DoubleSide});
  const wood=[],flowers=new Map(),leaves=[],flowerGeometry=blossomGeometry(),leafGeometry=smallLeafGeometry(),d=new T.Object3D(),tint=new T.Color();const attachments=[];let flowersCount=0,branchCount=0;
  function flower(p,diameter,spur){
    d.position.fromArray(p);d.scale.setScalar(diameter);d.rotation.set(rr(-.8,.8),rr(0,TAU),rr(-.8,.8));d.updateMatrix();
    const stemTip=new T.Vector3(0,.039,0).applyMatrix4(d.matrix).toArray();twig([spur,stemTip],.00065,1);
    const key=`${Math.floor(p[0]/2.5)},${Math.floor(p[1]/2.5)},${Math.floor(p[2]/2.5)}`;if(!flowers.has(key))flowers.set(key,[]);flowers.get(key).push({m:d.matrix.clone(),t:rr(.88,1.06)});flowersCount++;
  }
  function twig(points,radius,n=8,parent=null,parentT=null){const g=branch(points,radius,n);wood.push(g);branchCount++;if(parent&&parentT!==null)attachments.push({root:points[0],parent:parent.getPoint(parentT).toArray()});return g.userData.restorationCenterline;}
  const lean=options.lean??.55;
  const trunkPath=twig([[0,-.055,0],[-.10,height*.14,.08],[lean*.35,height*.29,0],[lean*.55,height*.46,-.15],[lean*.64,height*.67,-.12]],height*.027,24);
  for(let i=0;i<4;i++){const a=i*2.39996,x=Math.sin(a)*.57,z=Math.cos(a)*.57,y=options.localRootHeight?.(x,z)??-.05;twig([[.03,.25,.02],[Math.sin(a)*.23,Math.max(.07,y+.06),Math.cos(a)*.23],[x,y-.025,z]],height*.012,7);}
  // Long, open, ascending boughs. Flower sprays follow their terminal twigs.
  for(let b=0;b<7;b++){
    const a=b*2.39996+rr(-.18,.18),by=height*(.24+b*.057),reach=spread*(1-b*.045)*rr(.78,1),ex=lean+Math.sin(a)*reach,ez=Math.cos(a)*reach,ey=by+height*rr(.15,.24);
    const mainBase=pointAtHeight(trunkPath,by),mainPath=twig([mainBase,[ex*.42,by+height*.13,ez*.42],[ex,ey,ez]],height*(.014-b*.0011),16);
    for(let sec=0;sec<4;sec++){
      const t=.48+sec*.155,base=mainPath.getPoint(t).toArray(),az=a+(sec-1.5)*.47,reach2=spread*rr(.22,.32),end=[base[0]+Math.sin(az)*reach2,base[1]+height*rr(.05,.15),base[2]+Math.cos(az)*reach2];
      const secondaryPath=twig([base,[base[0]+Math.sin(az)*reach2*.54,base[1]+height*.10,base[2]+Math.cos(az)*reach2*.54],end],height*.0045,10,mainPath,t);
      for(let tw=0;tw<7;tw++){
        const tt=.30+tw*.105,root=secondaryPath.getPoint(tt).toArray(),aa=az+(tw%2?1:-1)*rr(.55,1.15),len=rr(.34,.68),tip=[root[0]+Math.sin(aa)*len,root[1]+rr(.06,.24),root[2]+Math.cos(aa)*len];
        const terminalPath=twig([root,[(root[0]+tip[0])/2,root[1]+.13,(root[2]+tip[2])/2],tip],.0065,7,secondaryPath,tt);
        for(let node=0;node<8;node++){
          const nt=.20+node*.105,p=terminalPath.getPoint(nt).toArray(),sa=aa+(node%2?1:-1)*.9,spur=[p[0]+Math.sin(sa)*.045,p[1]+.03,p[2]+Math.cos(sa)*.045];
          twig([p,spur],.0016,2,terminalPath,nt);
          // 3–5 blossoms on one short spur. Each corolla stays 2.7–4.3 cm.
          const count=3+((b+sec+tw+node)%3);
          for(let f=0;f<count;f++){
            const fa=f/count*TAU+sa,r=rr(.015,.036),centre=[spur[0]+Math.sin(fa)*r,spur[1]+rr(-.008,.023),spur[2]+Math.cos(fa)*r];
            flower(centre,rr(.027,.043),spur);
          }
          if(node%3===0&&tw%2===0){d.position.fromArray(p);d.rotation.set(rr(-.25,.4),sa,rr(-.3,.3));d.scale.set(rr(.060,.095),.09,rr(.060,.100));d.updateMatrix();leaves.push(d.matrix.clone());}
        }
      }
    }
  }
  const woodGeometry=mergeGeometries(wood),trunk=new T.Mesh(woodGeometry,bark);trunk.name='bifurcating-flowering-tree-trunk-and-spurs';trunk.castShadow=true;trunk.receiveShadow=true;group.add(trunk);wood.forEach(g=>g.dispose());
  for(const bucket of flowers.values()){
    const m=new T.InstancedMesh(flowerGeometry,petal,bucket.length);m.name='five-petal-blossoms-attached-to-spurs';bucket.forEach((v,i)=>{m.setMatrixAt(i,v.m);m.setColorAt(i,tint.setRGB(v.t,v.t,v.t));});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;m.computeBoundingSphere();group.add(m);
  }
  const leafMesh=new T.InstancedMesh(leafGeometry,leaf,leaves.length);leafMesh.name='small-thin-leaves-attached-to-terminal-twigs';leaves.forEach((m,i)=>leafMesh.setMatrixAt(i,m));leafMesh.instanceMatrix.needsUpdate=true;leafMesh.castShadow=true;leafMesh.receiveShadow=true;leafMesh.computeBoundingSphere();group.add(leafMesh);
  group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(group),stats={version:'flowering-branch-ref3-4-v2',flowerCount:flowersCount,leafCount:leaves.length,branchCount,meshes:flowers.size+2,triangles:(woodGeometry.index?.count??woodGeometry.attributes.position.count)/3+flowerGeometry.index.count/3*flowersCount+leafGeometry.index.count/3*leaves.length,buildMilliseconds:performance.now()-started};
  const foliageMeshes=[],normalMeshes=[];group.traverse(m=>{if(!m.isMesh||m.material.side!==T.DoubleSide)return;foliageMeshes.push(m);const n=new T.InstancedMesh(m.geometry,foliageNormalMaterial(m.material),m.count);n.instanceMatrix=m.instanceMatrix;n.instanceColor=m.instanceColor;n.matrix.copy(m.matrixWorld);n.matrixAutoUpdate=false;n.boundingSphere=m.boundingSphere;normalMeshes.push(n);});
  return{group,materials:{bark,petal,leaf},stats,bounds,foliageMeshes,normalMeshes,attachments,
    placement:{origin:options.origin??[0,0,0],height,spread,worldCoordinates:true,flowerDiameter:[.027,.043],worldRandomDraws:0,status:'Original-reference/CPU reconstruction candidate, not pixel acceptance. Explicit existing-tree replacement only, never an extra tree.'},
    dispose(){woodGeometry.dispose();flowerGeometry.dispose();leafGeometry.dispose();bark.dispose();petal.dispose();leaf.dispose();texture.dispose();normalMeshes.forEach(m=>m.material.dispose());group.removeFromParent();}
  };
}


// Nearest physically supported roots for the two existing mapped flank trees.
// Values come from a 12 mm XZ search with a .62 m root disk, the exact 64-sided
// mound fan, minimum water clearance .02 m, hall footprint and lamp exclusions.
// They do not change tree count or land geometry. The right tree stays maple.
export const restorationFlankTreePlan=Object.freeze([
  {side:'left',oldCall:[-24,1,10.5,'maple','leaf',1.2],islandIndex:2,origin:[-17.776726762,-.001343041213318347,1.428909604],height:6.3,spread:3.10,rootRadius:.62,replacement:'flowering-tree'},
  {side:'right',oldCall:[18,-2,8,'maple','leafGold',.3],islandIndex:1,origin:[3.547273238,.05647938228360222,.660909604],height:4.8,rootRadius:.62,replacement:'retain-old-maple-geometry'}
]);
export function restorationFlankTreeOffset(plan,{beforeSiteMatrix=false}={}){
  const s=referenceExteriorPlan.scale,t=referenceExteriorPlan.translation,[x,z]=plan.oldCall;
  const old=[x*s+t[0],-.2*s,z*s+t[2]],delta=plan.origin.map((v,i)=>v-old[i]);
  return new T.Matrix4().makeTranslation(...delta.map(v=>beforeSiteMatrix?v/s:v));
}
export function buildRestorationReference3FloweringTree({materials,options={}}={}){
  const p=restorationFlankTreePlan[0],island=referenceExteriorPlan.islands[p.islandIndex],yaw=options.yaw??.18,c=Math.cos(yaw),s=Math.sin(yaw);
  const result=buildRestorationFloweringTree({materials,options:{...options,origin:p.origin,height:p.height,spread:p.spread,lean:.46,yaw,seed:341016,
    localRootHeight:(x,z)=>restorationIslandSurface(island,p.origin[0]+x*c+z*s,p.origin[2]+z*c-x*s).y-p.origin[1]}});
  result.placement={...result.placement,...p,replacesOldCall:p.oldCall,oldWorldRandomDraws:201,transformAgain:false};
  return result;
}
