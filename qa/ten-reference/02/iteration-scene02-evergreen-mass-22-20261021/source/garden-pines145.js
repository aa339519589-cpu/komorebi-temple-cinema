import {T,V} from './kernel.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Japanese garden pine silhouettes are made from attached woody boughs and
// dense short shoots. Each shoot carries closed, tapered individual needles.
export function createGardenPines145(b,mats){
 let seed=0x145ceced;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const stats={rootedTrees:0,woodySegments:0,attachedNeedleSprays:0,individualNeedles:0,rootPositions:[],matureBankTrees:0,matureRootContacts:[]},wood=[];
 const dark=new T.MeshStandardMaterial({name:'scene02-garden-pine-old-needles',color:0x263e22,roughness:.80}),light=dark.clone();light.name='scene02-garden-pine-sunlit-new-needles';light.color.setHex(0x586d2e);
 dark.userData.thinLeaf=light.userData.thinLeaf=true;dark.userData.thinLeafTransmission=.25;light.userData.thinLeafTransmission=.42;Object.assign(mats,{gardenPineNeedles:dark,gardenPineNewNeedles:light});
 function timber(a,c,r0,r1){
  const va=V(a),vc=V(c),axis=vc.clone().sub(va),g=new T.CylinderGeometry(r1,r0,axis.length(),9,1),q=new T.Quaternion().setFromUnitVectors(V([0,1,0]),axis.clone().normalize());
  g.applyMatrix4(new T.Matrix4().compose(va.add(vc).multiplyScalar(.5),q,V([1,1,1])));g.applyMatrix4(b.stack.at(-1));wood.push(g);stats.woodySegments++;
 }
 const variants=Array.from({length:8},(_,variant)=>{
  const pos=[],idx=[];let count=0;
  function needle(start,end,radius){
   const direction=end.clone().sub(start).normalize(),side=new T.Vector3(0,1,0).cross(direction);if(side.lengthSq()<1e-8)side.set(1,0,0);side.normalize();const up=direction.clone().cross(side).normalize(),first=pos.length/3;
   for(let j=0;j<3;j++){const a=j*Math.PI*2/3,p=start.clone().addScaledVector(side,Math.cos(a)*radius).addScaledVector(up,Math.sin(a)*radius);pos.push(...p.toArray());}
   pos.push(...end.toArray());idx.push(first,first+2,first+1,first,first+1,first+3,first+1,first+2,first+3,first+2,first,first+3);count++;
  }
  // Three paired short axes spread the needles through volume, rather than a
  // flat photographic leaf card. Their bases overlap the carrying twig.
  for(let branch=0;branch<5;branch++){
   const angle=(branch-2)*.58+variant*.19,start=V([0,.015,0]),tip=V([Math.sin(angle)*.18,.06+branch*.012,.32+Math.cos(angle)*.05]);
   for(let i=0;i<26;i++){
    const t=.12+.84*(i+.5)/26,base=start.clone().lerp(tip,t),a=i*2.399+variant*.43+branch*.72,len=.060+random()*.046,spread=.050+random()*.040;
    const end=base.clone().add(V([Math.cos(a)*spread,.018+Math.sin(a)*spread*.62,len]));needle(base,end,.0030+random()*.0014);
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();flat.name='scene02-five-axis-closed-pine-needle-shoot';return{geometry:flat,needles:count};
 });
 function add(x,z,h=5,r=2.5){
  const root=[x,.025,z],lean=(random()-.5)*.34,stem=[root,[x+.04,h*.28,z-.06],[x+lean*.40,h*.58,z+.04],[x+lean,h*.88,z+.03],[x+lean*.9,h,z+.04]];
  for(let j=0;j<stem.length-1;j++)timber(stem[j],stem[j+1],.13*(1-j*.22)*h/5,.13*(1-(j+1)*.22)*h/5);
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5,spread=.38*h/5;timber([x+Math.cos(a)*spread,-.015,z+Math.sin(a)*spread],[x,.38,z],.035*h/5,.095*h/5);}
  for(let tier=0;tier<4;tier++){
   const ty=h*(.31+tier*.18),arms=tier===0?5:4,reach=r*(.98-tier*.13),center=[x+lean*ty/h,ty,z+.02];
   for(let arm=0;arm<arms;arm++){
    const a=arm*Math.PI*2/arms+tier*.76+(random()-.5)*.20,extension=reach*(.84+random()*.26),middle=[center[0]+Math.cos(a)*extension*.53,ty+.035*h,center[2]+Math.sin(a)*extension*.53],tip=[center[0]+Math.cos(a)*extension,ty+.070*h,center[2]+Math.sin(a)*extension];
    timber(center,middle,.032*h/5,.021*h/5);timber(middle,tip,.021*h/5,.009*h/5);
    for(let shoot=0;shoot<60;shoot++){
     const aa=shoot*2.399+arm*.61,rad=Math.sqrt(random()),rx=extension*.42,rz=extension*.34,position=[tip[0]+Math.cos(aa)*rx*rad,tip[1]+(random()-.5)*h*.095,tip[2]+Math.sin(aa)*rz*rad],seat=[middle[0]*.26+tip[0]*.74,middle[1]*.26+tip[1]*.74,middle[2]*.26+tip[2]*.74];
     timber(seat,position,.0060*h/5,.0024*h/5);
     const variant=variants[(shoot+arm*3+tier*5)%variants.length],size=(.91+random()*.42)*(h/5)**.35,rotation=[-.25+random()*.45,a+(random()-.5)*2.0,(random()-.5)*.45];
     b.put(variant.geometry,shoot%5===0?light:dark,position,[size,size,size],rotation,.73+random()*.42);stats.attachedNeedleSprays++;stats.individualNeedles+=variant.needles;
    }
   }
  }
  const top=stem.at(-1);
  for(let j=0;j<24;j++){const a=j*2.399,rr=.28*Math.sqrt(random())*h/5,position=[top[0]+Math.cos(a)*rr,top[1]+(random()-.5)*.20,top[2]+Math.sin(a)*rr],variant=variants[j%variants.length],size=.85+random()*.30;timber(top,position,.005,.002);b.put(variant.geometry,j%5===0?light:dark,position,[size,size,size],[-.4+random()*.4,a,0]);stats.attachedNeedleSprays++;stats.individualNeedles+=variant.needles;}
  stats.rootedTrees++;stats.rootPositions.push(V(root).applyMatrix4(b.stack.at(-1)).toArray());
 }
 function organicLimb(points,r0,r1){
  const curve=new T.CatmullRomCurve3(points.map(V)),N=10,R=20,pos=[],uv=[],ids=[];
  for(let j=0;j<=R;j++){
   const t=j/R,p=curve.getPoint(t),d=curve.getTangent(t).normalize(),side=V([0,1,0]).cross(d);if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();const up=d.clone().cross(side),r=(r0*(1-t)+r1*t)*(1+.07*Math.sin(t*19.1));
   for(let k=0;k<N;k++){const a=k*Math.PI*2/N,q=1+.075*Math.sin(a*3+t*11);pos.push(...p.clone().addScaledVector(side,Math.cos(a)*r*q).addScaledVector(up,Math.sin(a)*r*q).toArray());uv.push(k/N,t*curve.getLength());}
  }
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,c=j*N+(k+1)%N;ids.push(a,c,a+N,c,c+N,a+N);}
  for(const j of[0,R]){const n=pos.length/3;pos.push(...curve.getPoint(j/R).toArray());uv.push(.5,.5);for(let k=0;k<N;k++){const a=j*N+k,c=j*N+(k+1)%N;j?ids.push(n,a,c):ids.push(n,c,a);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.applyMatrix4(b.stack.at(-1));wood.push(g);stats.woodySegments++;
 }
 function addMature(x,z,h=3.1,r=1.35,soil=()=>0){
  // Mature garden pines use a bent scaffold and unequal foliage pads, with
  // roots sampled on the same graded soil as the bank rather than a flat y0.
  const y=soil(x,z),heading=random()*Math.PI*2,lean=r*.23,stem=[[x,y-.035,z],[x+Math.cos(heading)*lean*.52,y+h*.27,z+Math.sin(heading)*lean*.52],[x-Math.sin(heading)*lean*.48,y+h*.56,z+Math.cos(heading)*lean*.48],[x+Math.cos(heading)*lean,y+h*.81,z+Math.sin(heading)*lean],[x+Math.cos(heading)*lean*.91,y+h,z+Math.sin(heading)*lean*.91]];
  organicLimb(stem,.18*h/3.1,.020*h/3.1);
  for(let j=0;j<7;j++){
   const a=j*2.399+heading,reach=.36+.20*random(),xx=x+Math.cos(a)*reach,zz=z+Math.sin(a)*reach;
   timber([xx,soil(xx,zz)-.025,zz],[x+(stem[1][0]-x)*.18,y+.30,z+(stem[1][2]-z)*.18],.030*h/3.1,.10*h/3.1);
  }
  function alongStem(t){const q=Math.min(3,Math.floor(t*4)),f=t*4-q;return V(stem[q]).lerp(V(stem[q+1]),f).toArray();}
  function pad(centre,rx,rz,ry,seat,angle,index){
   // Actual needle sprays occupy an irregular flattened volume. Every fine
   // twig joins the carrying bough; no sphere, cone or opaque foliage card.
   const count=Math.max(145,Math.round(Math.PI*rx*rz/.009));
   for(let j=0;j<count;j++){
    const aa=j*2.399+index*.37,rho=Math.sqrt(random()),q=.86+.12*Math.sin(aa*3+index)+.08*Math.sin(aa*7),px=centre[0]+Math.cos(aa)*rx*rho*q,pz=centre[2]+Math.sin(aa)*rz*rho*q,py=centre[1]+ry*(1.12*Math.sqrt(Math.max(0,1-rho*rho))-.28+(random()-.5)*1.10),position=[px,py,pz],elbow=[mixN(seat[0],px,.62),mixN(seat[1],py,.53),mixN(seat[2],pz,.62)];
    timber(seat,elbow,.0060*h/3.1,.0036*h/3.1);timber(elbow,position,.0036*h/3.1,.0018*h/3.1);
    const item=variants[(j+index*3)%variants.length],size=.64+random()*.31;b.put(item.geometry,j%7===0?light:dark,position,[size,size,size],[-.45+random()*.55,angle+aa*.17+(random()-.5)*1.8,(random()-.5)*.72],.68+random()*.36);stats.attachedNeedleSprays++;stats.individualNeedles+=item.needles;
   }
  }
  function mixN(a,c,t){return a+(c-a)*t;}
  const heights=[.33,.51,.69,.84],turns=[.15,2.63,.93,3.91];
  for(let arm=0;arm<4;arm++){
   const origin=alongStem(heights[arm]),a=heading+turns[arm]+(random()-.5)*.33,reach=r*(1-arm*.14)*(.90+random()*.16),middle=[origin[0]+Math.cos(a)*reach*.54,origin[1]+h*.055,origin[2]+Math.sin(a)*reach*.54],tip=[origin[0]+Math.cos(a)*reach,origin[1]+h*(.085+random()*.025),origin[2]+Math.sin(a)*reach];
   organicLimb([origin,middle,tip],.062*h/3.1,.014*h/3.1);
   for(const side of[-1,1]){
    const aa=a+side*.62,seat=[mixN(middle[0],tip[0],.78),mixN(middle[1],tip[1],.78),mixN(middle[2],tip[2],.78)],centre=[tip[0]+Math.cos(aa)*r*.18,tip[1]+side*h*.012,tip[2]+Math.sin(aa)*r*.18];timber(seat,centre,.016*h/3.1,.008*h/3.1);
    pad(centre,r*(.36-arm*.025),r*(.29-arm*.018),h*.14,centre,a,arm*2+(side>0?1:0));
   }
  }
  const top=stem.at(-1);pad([top[0],top[1]-.10,top[2]],r*.34,r*.29,h*.14,top,heading,9);
  stats.rootedTrees++;stats.matureBankTrees++;stats.rootPositions.push(V([x,y-.035,z]).applyMatrix4(b.stack.at(-1)).toArray());stats.matureRootContacts.push({position:V([x,y,z]).applyMatrix4(b.stack.at(-1)).toArray(),height:h,crownReach:r,soilContact:'Centre and each exposed buttress toe sampled on the physical graded soil surface'});
 }
 function finish(){
  const flat=wood.map(g=>{const n=g.toNonIndexed();g.dispose();return n;}),g=mergeGeometries(flat,false);if(!g)throw Error('Scene02 garden-pine bearing skeleton merge failed.');g.name='scene02-rooted-garden-pine-connected-boughs';for(const p of flat)p.dispose();b.put(g,'trunk');
  return{...stats,construction:'Soil-embedded buttress roots, tapered woody limbs, tiered attached branchlets and solid individually tapered needle shoots; no billboard crowns',visualAccepted:false};
 }
 return{add,addMature,finish};
}
