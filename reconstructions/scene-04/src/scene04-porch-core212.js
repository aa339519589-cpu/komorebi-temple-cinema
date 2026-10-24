import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {carveBearingSolid212} from './scene04-carved-bearing212.js';
import {createPrecisionTimberFactory04,setTimberEndGrainAttributes212} from './scene04-timber-precision134.js';

// HD04-led joined timber sections. A coved face and its carving are cut into
// the closed beam itself. The member buries into the column; no front plaque.
export function createJoinedCarvedBeam212({width,height,depth=.64,y,z,x=0,bow=.022,centres,continuous=.24,carveDepth=.043,frontCove=.024,label='joined-bearing'}={}){
 const w=width/2,h=height,s=new T.Shape();s.moveTo(-w,h*.31);s.quadraticCurveTo(-w+.05,h*.51,-w+.20,h*.46);s.bezierCurveTo(-width*.26,h*.48+bow,-width*.11,h*.48+bow,0,h*.46+bow);s.bezierCurveTo(width*.11,h*.48+bow,width*.26,h*.48+bow,w-.20,h*.46);s.quadraticCurveTo(w+.015,h*.51,w,h*.18);s.lineTo(w,-h*.20);s.quadraticCurveTo(w-.015,-h*.51,w-.18,-h*.47);s.bezierCurveTo(width*.25,-h*.47,width*.10,-h*.49,0,-h*.46);s.bezierCurveTo(-width*.10,-h*.49,-width*.25,-h*.47,-w+.18,-h*.47);s.quadraticCurveTo(-w-.015,-h*.51,-w,-h*.20);s.closePath();
 const bevel=Math.min(.028,height*.075),raw=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4,curveSegments:34}),g=carveBearingSolid212(raw,{shape:s,width,height,centres,continuous,depth:carveDepth,frontCove});g.translate(x,y,z-depth-bevel);g.userData.architectureMember='scene04-212-'+label;g.userData.joinedBearing212={nominalWidth:width,nominalHeight:height,nominalFrontZ:z,nominalDepth:depth,continuousInsetCarving:true,columnMortiseInterpretation:true,visualAccepted:false};return g;
}

export function createForkedBearing212({x,y,z,width=.76,height=.52,depth=.35}={}){
 const w=width/2,h=height/2,s=new T.Shape();s.moveTo(-w,-h);s.quadraticCurveTo(-w*.94,-h*.30,-w*.56,-h*.12);s.bezierCurveTo(-w*.33,h*.15,-w*.38,h*.70,-w*.21,h);s.lineTo(w*.21,h);s.bezierCurveTo(w*.38,h*.70,w*.33,h*.15,w*.56,-h*.12);s.quadraticCurveTo(w*.94,-h*.30,w,-h);s.lineTo(w*.40,-h);s.quadraticCurveTo(0,-h*.22,-w*.40,-h);s.closePath();
 const hole=new T.Path();hole.absellipse(0,-height*.16,width*.11,height*.13,0,Math.PI*2,true);s.holes.push(hole);
 const raw=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.013,bevelThickness:.012,bevelSegments:4,curveSegments:28}),g=carveBearingSolid212(raw,{shape:s,width,height,centres:[[0,width*.45]],depth:.023,frontCove:.006,continuous:.32,grainAxis:1});g.translate(x,y,z-depth-.012);g.userData.architectureMember='scene04-212-forked-curved-bearing-between-beams';g.userData.joinedBearing212={actualPiercedOpening:true,footOnLowerBeam:true,headUnderUpperBeam:true,visualAccepted:false};return g;
}

export function createColumnNeck212({x,y,z,width=.36,height=.60,depth=.12}={}){
 const w=width/2,h=height/2,s=new T.Shape();s.moveTo(-w,h);s.lineTo(w,h);s.lineTo(w*.93,-h*.64);s.quadraticCurveTo(w*.79,-h,w*.55,-h);s.lineTo(-w*.55,-h);s.quadraticCurveTo(-w*.79,-h,-w*.93,-h*.64);s.closePath();const raw=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:3,curveSegments:20}),g=carveBearingSolid212(raw,{shape:s,width,height,centres:[[0,width*.7]],depth:.012,frontCove:.004,continuous:.55,grainAxis:1});g.translate(x,y,z-depth-.006);g.userData.architectureMember='scene04-212-closed-shaft-neck-with-inlaid-carving';return g;
}

// Actual closed sculptural timber, not a repeated relief image on a box.
// The silhouette and cut-outs remain inferred from the HD04 architectural type.
export function createRainbowBeam212({width=6.90,height=.64,depth=.66,y=8.3,z=.35}={}){
 const w=width/2,h=height,shape=new T.Shape();
 shape.moveTo(-w,.10*h);shape.bezierCurveTo(-w-.08,.52*h,-w+.20,.73*h,-w+.43,.50*h);
 shape.bezierCurveTo(-w+.80,.35*h,-width*.23,.42*h,0,.32*h);
 shape.bezierCurveTo(width*.23,.42*h,w-.80,.35*h,w-.43,.50*h);
 shape.bezierCurveTo(w-.20,.73*h,w+.08,.52*h,w,.10*h);
 shape.bezierCurveTo(w+.035,-.11*h,w-.10,-.40*h,w-.37,-.26*h);
 shape.bezierCurveTo(w-.64,-.13*h,w-.72,-.49*h,w-1.0,-.30*h);
 shape.bezierCurveTo(width*.22,-.46*h,width*.08,-.51*h,0,-.58*h);
 shape.bezierCurveTo(-width*.08,-.51*h,-width*.22,-.46*h,-w+1.0,-.30*h);
 shape.bezierCurveTo(-w+.72,-.49*h,-w+.64,-.13*h,-w+.37,-.26*h);
 shape.bezierCurveTo(-w+.10,-.40*h,-w-.035,-.11*h,-w,.10*h);shape.closePath();
 let g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.045,bevelThickness:.060,bevelSegments:5,curveSegments:44});g=carveBearingSolid212(g,{shape,width,height,depth:.032,centres:height<.6?[[-2.13,.34],[0,.52],[2.13,.34]]:[[-2.35,.25],[-1.19,.20],[0,.55],[1.19,.20],[2.35,.25]]});g.translate(0,y,z-depth+.020);g.userData.porchCore212={closed:true,depth,actualCarvedBearingSolid:true,referenceImageUsedAsTexture:false};return g;
}
export function createPiercedRanma212({width=5.32,height=.65,depth=.29,y=8.75,z=.25}={}){
 const w=width/2,h=height,shape=new T.Shape();
 shape.moveTo(-w,-h*.22);shape.bezierCurveTo(-w-.10,h*.10,-w+.10,h*.48,-w+.42,h*.37);
 shape.bezierCurveTo(-w+.80,h*.55,-w+.91,h*.28,-w+1.14,h*.38);
 shape.bezierCurveTo(-width*.18,h*.62,-width*.08,h*.45,0,h*.53);
 shape.bezierCurveTo(width*.08,h*.45,width*.18,h*.62,w-1.14,h*.38);
 shape.bezierCurveTo(w-.91,h*.28,w-.80,h*.55,w-.42,h*.37);
 shape.bezierCurveTo(w-.10,h*.48,w+.10,h*.10,w,-h*.22);
 shape.bezierCurveTo(w-.22,-h*.45,w-.48,-h*.22,w-.72,-h*.40);
 shape.bezierCurveTo(width*.25,-h*.47,width*.1,-h*.33,0,-h*.46);
 shape.bezierCurveTo(-width*.1,-h*.33,-width*.25,-h*.47,-w+.72,-h*.40);
 shape.bezierCurveTo(-w+.48,-h*.22,-w+.22,-h*.45,-w,-h*.22);shape.closePath();
 for(let k=0;k<5;k++){
  const x=(k-2)*width*.18,ry=height*(k===2?.245:.208),rx=width*(k===2?.085:.073),hole=new T.Path();
  hole.absellipse(x,0,rx,ry,0,Math.PI*2,true,(k-2)*.12);shape.holes.push(hole);
 }
 const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.043,bevelThickness:.055,bevelSegments:6,curveSegments:44});g.translate(0,y,z-depth+.025);
 g.userData.architectureMember='scene04-212-through-carved-cloud-ranma';g.userData.porchCore212={actualThroughHoles:5,depth,bevelMetres:.043,referenceImageUsedAsTexture:false};return g;
}
export function createPiercedWindow212({width=1.55,height=2.56,depth=.11}={}){
 const parts=[],timber=createPrecisionTimberFactory04(),nx=Math.max(8,Math.round(width/.14)),ny=Math.max(12,Math.round(height/.14)),bar=.018,rx=width*.285,ry=height*.215;
 const inner=Array.from({length:8},(_,k)=>{const a=Math.PI/8+k*Math.PI/4;return new T.Vector2(Math.cos(a)*rx,Math.sin(a)*ry);});
 const addBox=(x,y,z,w,h,d)=>{if(w<.002||h<.002)return;const g=timber.box(w,h,d).clone();g.translate(x,y,z);parts.push(g);};
 const cutAt=(value,axis)=>{
  const hits=[];for(let k=0;k<inner.length;k++){const a=inner[k],b=inner[(k+1)%inner.length],va=axis===0?a.x:a.y,vb=axis===0?b.x:b.y;if(value<Math.min(va,vb)-1e-8||value>Math.max(va,vb)+1e-8||Math.abs(vb-va)<1e-8)continue;const t=(value-va)/(vb-va);hits.push((axis===0?a.y:a.x)+t*((axis===0?b.y:b.x)-(axis===0?a.y:a.x)));}return hits.length?[Math.min(...hits),Math.max(...hits)]:null;
 };
 // Each grid member really terminates in the octagonal frame. The two
 // directions weave at different depths and leave open cells behind them.
 for(let i=1;i<nx;i++){
  const x=-width/2+width*i/nx,cut=cutAt(x,0),zz=-depth*.08;
  if(cut){const a=-height/2,b=cut[0]-.022,c=cut[1]+.022,d=height/2;addBox(x,(a+b)/2,zz,bar,b-a,depth*.50);addBox(x,(c+d)/2,zz,bar,d-c,depth*.50);}
  else addBox(x,0,zz,bar,height,depth*.50);
 }
 for(let j=1;j<ny;j++){
  const y=-height/2+height*j/ny,cut=cutAt(y,1),zz=depth*.08;
  if(cut){const a=-width/2,b=cut[0]-.022,c=cut[1]+.022,d=width/2;addBox((a+b)/2,y,zz,b-a,bar,depth*.50);addBox((c+d)/2,y,zz,d-c,bar,depth*.50);}
  else addBox(0,y,zz,width,bar,depth*.50);
 }
 const surround=new T.Shape();for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4,p=[Math.cos(a)*(rx+.034),Math.sin(a)*(ry+.034)];k?surround.lineTo(...p):surround.moveTo(...p);}surround.closePath();
 const opening=new T.Path();for(let k=7;k>=0;k--){const p=inner[k];k===7?opening.moveTo(p.x,p.y):opening.lineTo(p.x,p.y);}opening.closePath();surround.holes.push(opening);
 const rim=new T.ExtrudeGeometry(surround,{depth:depth*.70,steps:1,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2,curveSegments:1});rim.translate(0,0,-depth*.35);setTimberEndGrainAttributes212(rim,1);parts.push(rim);
 for(const x of[-width/2,width/2])addBox(x,0,-depth*.12,.054,height+.05,depth);
 for(const y of[-height/2,height/2])addBox(0,y,-depth*.12,width+.05,.054,depth);
 const all=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(all,false);parts.forEach(p=>p.dispose());all.forEach(p=>p.dispose());g.userData.architectureMember='scene04-237-deep-square-lattice-with-open-octagonal-light';g.userData.porchCore212={squareGrid:[nx,ny],realBarWidthMetres:bar,barWeaveDepthMetres:depth*.16,octagonalOpening:[rx*2,ry*2],eachBarTerminatesInRim:true,realBarDepthMetres:depth*.50,frameDepthMetres:depth,referenceImageUsedAsTexture:false};return g;
}

export function createHangingLotus212({y=11.1,z=1.57}={}){
 const parts=[];
 const petal=(end,width,bend)=>{
  const path=new T.CatmullRomCurve3([new T.Vector3(0,.12,0),new T.Vector3(end[0]*.48,end[1]*.43+.035,bend),new T.Vector3(end[0],end[1],.005)]),N=24,R=12,frames=path.computeFrenetFrames(N,false),p=[],id=[];
  for(let j=0;j<=N;j++){const t=.006+.988*j/N,c=path.getPoint(t),r=Math.sin(Math.PI*t);for(let k=0;k<R;k++){const a=k*Math.PI*2/R,q=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*width*Math.pow(r,.72)).addScaledVector(frames.binormals[j],Math.sin(a)*.025*r);p.push(q.x,q.y,q.z);}}
  for(let j=0;j<N;j++)for(let k=0;k<R;k++){const n=(k+1)%R,a=j*R+k,b=j*R+n,c=a+R,d=b+R;id.push(a,c,b,b,c,d);}
  for(const j of[0,N]){const c=path.getPoint(.006+.988*j/N),at=p.length/3;p.push(c.x,c.y,c.z);for(let k=0;k<R;k++)id.push(at,j*R+k,j*R+(k+1)%R);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));for(let k=0;k<id.length;k+=3)[id[k+1],id[k+2]]=[id[k+2],id[k+1]];for(let k=id.length-R*3;k<id.length;k+=3)[id[k+1],id[k+2]]=[id[k+2],id[k+1]];g.setIndex(id);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((v,i)=>i%3===0?[p[i],p[i+1]]:[]),2));parts.push(g);
 };
 for(const[x,yy,w,bend]of[[-.55,.20,.09,.045],[-.36,.30,.095,.070],[-.14,.24,.080,.085],[.14,.24,.080,.085],[.36,.30,.095,.070],[.55,.20,.09,.045],[-.29,-.20,.09,.10],[-.14,-.34,.085,.13],[0,-.43,.10,.15],[.14,-.34,.085,.13],[.29,-.20,.09,.10]])petal([x,yy],w,bend);
 parts.push(new T.SphereGeometry(.095,20,12).scale(1,1,.47).translate(0,.10,.075));
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.translate(0,y,z);g.userData.architectureMember='scene04-212-layered-sculptural-lotus-pendant';g.userData.porchCore212={individualCurvedPetals:11,actualNegativeSpaceBetweenPetals:true,referenceImageUsedAsTexture:false};return g;
}

// Separate curved, closed petal bodies make an open floral boss. This is an
// authored motif, not a crop of the scalar guide or a measured historic relief.
export function createFloralBoss212({width=.65,height=.35,depth=.075,petals=8,phase=0,y=0,z=0}={}){
 const parts=[];
 function petal(angle,reach,span,lift){
  const N=20,R=10,p=[],uv=[],ix=[],gilt=[],centre=t=>{const a=angle+.16*Math.sin(Math.PI*t+phase);return new T.Vector3(Math.cos(a)*(.045+reach*t),Math.sin(a)*(.045+reach*t),lift+depth*.40*Math.sin(Math.PI*t));};
  for(let j=0;j<=N;j++){
   const t=.008+.984*j/N,c=centre(t),a=angle+.16*Math.sin(Math.PI*t+phase),w=span*Math.pow(Math.sin(Math.PI*t),.76),th=depth*.36*Math.sin(Math.PI*t);
   for(let k=0;k<R;k++){const phi=k*Math.PI*2/R,q=c.clone().add(new T.Vector3(-Math.sin(a)*Math.cos(phi)*w,Math.cos(a)*Math.cos(phi)*w,Math.sin(phi)*th));p.push(q.x,q.y,q.z);uv.push(t,k/R);gilt.push(.12+.88*T.MathUtils.smoothstep(Math.sin(phi),-.08,.75));}
  }
  for(let j=0;j<N;j++)for(let k=0;k<R;k++){const a=j*R+k,b=j*R+(k+1)%R,c=a+R,d=b+R;ix.push(a,b,c,b,d,c);}
  for(const j of[0,N]){const c=centre(.008+.984*j/N),at=p.length/3;p.push(c.x,c.y,c.z);uv.push(.5,.5);gilt.push(.2);for(let k=0;k<R;k++){const a=j*R+k,b=j*R+(k+1)%R;j?ix.push(at,a,b):ix.push(at,b,a);}}
  let volume=0;for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3;volume+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}
  if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('sculpt212Gilt',new T.Float32BufferAttribute(gilt,1));g.setIndex(ix);g.computeVertexNormals();parts.push(g);
 }
 for(let k=0;k<petals;k++)petal(k*Math.PI*2/petals+phase,.35+.025*Math.sin(k*1.71+phase),.076+.012*Math.cos(k*2.3),0);
 for(let k=0;k<5;k++)petal(k*Math.PI*2/5+phase+.4,.17,.057,depth*.42);
 const centre=new T.SphereGeometry(.080,20,12);centre.scale(1,1,.45);centre.translate(0,0,depth*.84);centre.setAttribute('sculpt212Gilt',new T.Float32BufferAttribute(new Float32Array(centre.attributes.position.count).fill(.86),1));parts.push(centre);
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.scale(width/.86,height/.86,1);g.translate(0,y,z);g.userData.architectureMember='scene04-212-individual-curved-petal-floral-boss';g.userData.porchCore212={closedPetalBodies:petals+5,realOpenSpacesBetweenPetals:true,independentAuthoredMotif:true,referenceImageUsedAsTexture:false};return g;
}

// Small real closed petal bodies grow from the carved beam front. Their back
// enters the timber; the metal mask follows the same vertices and PBR chain.
// The visible sculptural front stays in place. Back-facing wood returns
// through the actual carved cove, giving each closed petal real substance
// inside the beam while preserving the open gaps between the petals.
export function embedFloralBack237(g,depth=.090){
 const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-depth*T.MathUtils.smoothstep(-n.getZ(i),.05,.75));g.computeVertexNormals();g.userData.embeddedFloralBack237={backReturnMetres:depth,frontFacingSurfaceRetained:true,flatBackingPlaque:false};return g;
}

export function attachFloralCarving237(beam,flowers=[]){
 const parts=[beam],records=[];
 for(const f of flowers){
  const g=createFloralBoss212({width:f.width,height:f.height,depth:f.depth??.045,petals:f.petals??8,phase:f.phase??0,y:f.y,z:f.z});g.translate(f.x??0,0,0);embedFloralBack237(g,f.rootDepth??.090);
  g.setAttribute('beam212Gilt',g.attributes.sculpt212Gilt);g.deleteAttribute('sculpt212Gilt');setTimberEndGrainAttributes212(g,0);parts.push(g);records.push({...f,closedPetalBodies:(f.petals??8)+5,rootReturnMetres:f.rootDepth??.090,backEntersBeam:true});
 }
 const g=mergeGeometries(parts,false);if(!g)throw Error('237 floral carving join failed');g.userData={...beam.userData,floralCarving237:{realClosedPetalBodies:records.reduce((n,r)=>n+r.closedPetalBodies,0),closedRosetteCentres:records.length,flowers:records,flatPlaque:false,referenceImageUsed:false}};parts.forEach(p=>p.dispose());return g;
}
