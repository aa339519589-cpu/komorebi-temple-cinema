import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// One connected route: hall threshold, stone flight, lower landing, paved turn,
// and the open east end of the timber bridge. All heights are surface heights.
export const circulation133 = {
  hall:{position:[7.7,0,-14],yaw:-.64,scale:[1,1.17,1],floor:3.09},
  stair:{width:6.5,upperZ:6.4,lowerZ:10.6,lowerY:1.25/1.17,count:14},
  bridge:{eastX:5.16,nearZ:3.19,farZ:.01,deckY:1.25},
  evidence:'Authored reconstruction; exact hidden masonry is not recoverable from one image.'
};
const v=a=>new T.Vector3(...a);
function toWorld(x,y,z){const h=circulation133.hall,c=Math.cos(h.yaw),s=Math.sin(h.yaw);return [h.position[0]+c*x+s*z,y*h.scale[1],h.position[2]-s*x+c*z];}

// Closed solid with independent flat surface charts, in scene metres.
function prism(poly,lo,hi,name){
  let p2=poly.map(p=>[...p]);
  if(p2.reduce((s,a,i)=>{const b=p2[(i+1)%p2.length];return s+a[0]*b[1]-b[0]*a[1];},0)<0)p2.reverse();
  const p=[],uv=[],tri=(a,b,c)=>{const n=v(b).sub(v(a)).cross(v(c).sub(v(a))).normalize(),axis=Math.abs(n.y)>.5?1:Math.abs(n.x)>Math.abs(n.z)?0:2;for(const q of[a,b,c]){p.push(...q);uv.push(...(axis===1?[q[0],q[2]]:axis===0?[q[2],q[1]]:[q[0],q[1]]));}};
  const shape=p2.map(p=>new T.Vector2(...p)),ids=T.ShapeUtils.triangulateShape(shape,[]);
  for(const [a,b,c]of ids){const A=p2[a],B=p2[b],C=p2[c];tri([A[0],hi,A[1]],[C[0],hi,C[1]],[B[0],hi,B[1]]);tri([A[0],lo,A[1]],[B[0],lo,B[1]],[C[0],lo,C[1]]);}
  for(let i=0;i<p2.length;i++){const a=p2[i],b=p2[(i+1)%p2.length];tri([a[0],lo,a[1]],[a[0],hi,a[1]],[b[0],lo,b[1]]);tri([b[0],lo,b[1]],[a[0],hi,a[1]],[b[0],hi,b[1]]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name=name;return g;
}
function metreBox(w,h,d){const g=new RoundedBoxGeometry(w,h,d,2,.008),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));uv.setXY(i,ny>nx&&ny>nz?p.getX(i):nx>nz?p.getZ(i):p.getX(i),ny>nx&&ny>nz?p.getZ(i):p.getY(i));}return g;}

export async function buildCirculation133({emit,box,between,group,materials:M,scans,ownedMaterials,ownedTextures}){
  const stone=M.cutStone.clone();stone.name='route133-metric-granite';stone.color.setRGB(1.10,1.13,1.12);stone.roughness=.88;stone.normalScale.set(.37,.37);stone.envMapIntensity=.8;ownedMaterials.push(stone);
  const loader=new T.TextureLoader(),maps=await Promise.all(['diff','nor_gl','rough'].map(k=>loader.loadAsync('/reconstructions/scene-04/assets/granite-tile-04/granite-face-'+k+'.png')));
  for(const [i,t]of maps.entries()){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3.151,3.151);t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;ownedTextures.push(t);}
  [stone.map,stone.normalMap,stone.roughnessMap]=maps;stone.color.setHex(0xb4b3ad);
  const cap=stone.clone();cap.name='route133-damp-tread-granite';cap.color.setRGB(1.27,1.25,1.18);cap.roughness=.65;ownedMaterials.push(cap);
  const soil=M.cutStoneDark.clone();soil.name='route133-supported-earth';soil.color.setHex(0x383b2c);soil.normalScale.set(.6,.6);ownedMaterials.push(soil);
  const plan=circulation133,S=plan.stair,top=plan.hall.floor,rise=(top-S.lowerY)/S.count,run=(S.lowerZ-S.upperZ)/S.count,records=[],plants=[],walkSurfaces=[];
  const worldPolygon=(poly,y)=>poly.map(([x,z])=>{const p=toWorld(x,y,z);return[p[0],p[2]];});
  function solid(poly,lo,hi,mat,name){emit(prism(poly,lo,hi,name),mat);}
  function block(x,y,z,w,h,d,mat,tint=1){emit(metreBox(w,h,d),mat,x,y,z,1,1,1,0,tint);}
  group(...plan.hall.position,plan.hall.yaw,()=>{
    // New upper landing meets the front edge of the existing hall slab at
    // z=6.1. It does not run underneath it or terminate against a vertical wall.
    const upperLanding=[[-3.25,6.1],[3.25,6.1],[3.25,S.upperZ],[-3.25,S.upperZ]];
    solid(upperLanding,-.15,top-.13,stone,'supported-upper-landing');
    walkSurfaces.push({poly:worldPolygon(upperLanding,top),height:top*1.17});
    for(let j=0;j<5;j++)block(-3.25+(j+.5)*1.3,top-.065,(6.1+S.upperZ)/2,1.292,.13,S.upperZ-6.1,cap,.96+.04*Math.sin(j*2.3));
    // The flight is a single closed stepped masonry volume. Tread caps are
    // separately jointed stones, not one giant board for each whole step.
    const cross=[[S.lowerZ,-.15],[S.upperZ,-.15],[S.upperZ,top-.13]];
    for(let i=S.count-1;i>=0;i--){const z=S.lowerZ-(i+1)*run,y=S.lowerY+(i+1)*rise-.13;cross.push([z,y],[z+run,y]);if(i>0)cross.push([z+run,y-rise]);}
    // Extrusion starts in the Z/Y section and runs across the full stair width.
    const sh=new T.Shape();cross.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));sh.closePath();
    const g=new T.ExtrudeGeometry(sh,{depth:S.width,bevelEnabled:false,steps:1});g.rotateY(-Math.PI/2);g.translate(S.width/2,0,0);g.name='single-closed-fourteen-riser-stair-core';emit(g,stone);
    for(let i=0;i<S.count;i++){
      const y=S.lowerY+(i+1)*rise,z=S.lowerZ-(i+.5)*run,joints=i%2?[-3.25,-2.55,-1.02,.55,2.12,3.25]:[-3.25,-1.96,-.66,.64,1.94,3.25];
      for(let k=0;k<joints.length-1;k++){const a=joints[k],b=joints[k+1];block((a+b)/2,y-.065,z,b-a-.008,.13,run-.006,cap,.91+.10*(.5+.5*Math.sin(i*3.17+k*6.2)));}
      const tread=[[ -S.width/2,S.lowerZ-i*run],[S.width/2,S.lowerZ-i*run],[S.width/2,S.lowerZ-(i+1)*run],[-S.width/2,S.lowerZ-(i+1)*run]];
      walkSurfaces.push({poly:worldPolygon(tread,y),height:y*1.17});
      records.push({riser:i+1,localTop:y,worldTop:y*1.17,frontZ:S.lowerZ-i*run,backZ:S.lowerZ-(i+1)*run});
    }
    // Broad landing at the foot is at the same elevation as the bridge deck.
    const lowerLanding=[[-3.43,S.lowerZ],[3.43,S.lowerZ],[3.43,13.3],[-3.43,13.3]];
    solid(lowerLanding,-.15,S.lowerY-.13,stone,'supported-lower-stair-landing');
    walkSurfaces.push({poly:worldPolygon(lowerLanding,S.lowerY),height:S.lowerY*1.17});
    for(let r=0;r<4;r++)for(let i=0;i<6;i++)block(-3.43+(i+.5)*6.86/6,S.lowerY-.065,10.6+(r+.5)*.675,6.86/6-.009,.13,.667,cap,.93+.06*Math.sin(i*2.7+r)**2);
    // Stone cheeks follow the same rise/run as the tread nosings. Their caps
    // support a red handrail whose posts have one continuous sloped top line.
    for(const side of[-1,1]){
      for(let i=0;i<S.count;i++){
        const y=S.lowerY+(i+1)*rise,z=S.lowerZ-(i+.5)*run;
        block(side*3.41,(y-.07)/2,z,.28,y+.07,run-.003,stone,.92+.07*Math.sin(i*1.7)**2);
        block(side*3.41,y+.01,z,.34,.10,run-.006,cap);
      }
      for(let i=0;i<=4;i++){
        const t=i/4,z=S.lowerZ-t*(S.lowerZ-S.upperZ),y=S.lowerY+t*(top-S.lowerY),x=side*3.41;
        block(x,y+.49,z,.16,.98,.16,M.bridgeRed);
        block(x,y+.99,z,.21,.065,.21,M.bronze);
        for(const zz of[z-.09,z+.09])block(x,y+.065,zz,.22,.13,.04,M.bronze);
      }
      for(const height of[.44,.93])between([side*3.41,S.lowerY+height,S.lowerZ],[side*3.41,top+height,S.upperZ],.10,.12,M.bridgeRed);
    }
    // Closed sloping rock/soil banks hide no camera-specific surfaces. All
    // rocks and planting are seated on the same sloping ground from either side.
  },plan.hall.scale);

  // The turning apron stays outside the end of the bridge. The previous
  // diagonal platform crossed its back guard and offered no clear passage.
  const floor=plan.bridge.deckY,near=[7.56,3.19],far=[7.56,-.42],toe=toWorld(3.43,S.lowerY,11.95),turn=[6.36,-.42];
  const dx=toe[0]-turn[0],dz=toe[2]-turn[1],len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,width=2.35,steps=Math.ceil(len/.62),pt=(t,s)=>[turn[0]+ux*t-uz*s,turn[1]+uz*t+ux*s];
  const apron=[[5.16,.01],[5.16,3.19],near,far,pt(0,width/2),pt(0,-width/2)];
  solid(apron,-.18,floor-.13,stone,'bridge-end-turning-apron-core');
  const clip=(poly,axis,limit,sign)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=sign*(a[axis]-limit),db=sign*(b[axis]-limit);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;};
  for(let r=0;r<7;r++)for(let c=0;c<4;c++){const x=5+c*.72,z=-1.4+r*.72;let poly=apron;for(const [axis,limit,sign]of[[0,x+.005,1],[0,x+.715,-1],[1,z+.005,1],[1,z+.715,-1]])poly=clip(poly,axis,limit,sign);if(poly.length>2)solid(poly,floor-.13,floor,cap,'separate-bridge-apron-paver-'+r+'-'+c);}
  const normal=[Math.cos(plan.hall.yaw),-Math.sin(plan.hall.yaw)],plane=normal[0]*toe[0]+normal[1]*toe[2],end=s=>{const p=pt(0,s),t=(plane-normal[0]*p[0]-normal[1]*p[1])/(normal[0]*ux+normal[1]*uz);return pt(t,s);};
  walkSurfaces.push({poly:apron,height:floor});
  const pathPolygons=walkSurfaces.map(s=>s.poly);
  for(let i=0;i<steps;i++){
    const a=len*i/steps,b=len*(i+1)/steps,finish=s=>i===steps-1?end(s):pt(b,s),poly=[pt(a,-width/2),pt(a,width/2),finish(width/2),finish(-width/2)];
    pathPolygons.push(poly);
    walkSurfaces.push({poly,height:floor});
    solid(poly,-.18,floor-.13,stone,'supported-path-section-'+i);
    for(let side=0;side<2;side++){const aa=-width/2+side*width/2+.005,bb=aa+width/2-.01,q=[pt(a+.004,aa),pt(a+.004,bb),finish(bb),finish(aa)];solid(q,floor-.13,floor,cap,'jointed-path-paving-'+i+'-'+side);}
  }
  // A real bank volume wraps the raised route, descending continuously into
  // the pond. It also carries the irregular retaining stones and their roots.
  function distance(poly,x,z){let inside=false,d=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[j],b=poly[i];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    const dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  }return inside?0:d;}
  const nearestWalkSurface=(x,z)=>{let d=Infinity,height=.06;for(const route of walkSurfaces){const q=distance(route.poly,x,z);if(q<d){d=q;height=route.height;}}return{distance:d,height};};
  const pathDistance=(x,z)=>nearestWalkSurface(x,z).distance;
  const bankY=(x,z)=>{const {distance:d,height}=nearestWalkSurface(x,z),t=T.MathUtils.smoothstep(d,.02,1.80),wave=.025*Math.sin(x*2.7+z*1.9)*Math.sin(z*2.8)*t;let h=.06+Math.max(0,height-.24-.06)*(1-t)+wave;if(x<5.16&&x>-6.36&&z>-.10&&z<3.30)h=Math.min(h,.58);return h;};
  const nx=88,nz=84,x0=-5,z0=-9,dxg=15/nx,dzg=14/nz,pp=[],uv=[],ix=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*dxg,z=z0+j*dzg;pp.push(x,bankY(x,z),z);uv.push(x,z);if(i<nx&&j<nz){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}}
  const edges=[];for(let i=0;i<=nx;i++)edges.push(i);for(let j=1;j<=nz;j++)edges.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)edges.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)edges.push(j*(nx+1));
  const bottom=[];for(const i of edges){bottom.push(pp.length/3);pp.push(pp[i*3],-.30,pp[i*3+2]);uv.push(pp[i*3],pp[i*3+2]);}
  for(let k=0;k<edges.length;k++){const l=(k+1)%edges.length,a=edges[k],b=edges[l],c=bottom[k],d=bottom[l];ix.push(a,b,c,b,d,c);}
  const centre=pp.length/3;pp.push(2.5,-.30,-2);uv.push(0,0);for(let k=0;k<bottom.length;k++)ix.push(centre,bottom[k],bottom[(k+1)%bottom.length]);
  const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(pp,3));ground.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ground.setIndex(ix);ground.computeVertexNormals();ground.name='continuous-pond-bank-beneath-bridge-landing-and-hall-route';emit(ground,soil);
  let stoneCount=0;
  for(let j=0;j<23;j++)for(let i=0;i<25;i++){
    const x=-4.6+i*.59+.14*Math.sin(i*11+j*2),z=-8.5+j*.61+.12*Math.cos(i*6+j*9),d=pathDistance(x,z);
    if(d<.32||d>1.18||(x<5.22&&x>-6.36&&z>-.15&&z<3.4))continue;
    const k=stoneCount++,scan=scans.variants[k%scans.variants.length],scale=.37+.21*(.5+.5*Math.sin(i*7.1+j*3.3));scan.geometry.computeBoundingBox();
    emit(scan.geometry,scan.material,x,bankY(x,z)-scan.geometry.boundingBox.min.y*scale-.14,z,scale,scale,scale,k*2.399,.86+.1*Math.sin(k*2)**2);
    if(k%2===0)plants.push([x,bankY(x,z)+.05,z]);
  }
  return {plan,steps:records,plants,lowerLandingWorld:toe,landingConnection:'right edge of 2.7 m deep lower landing; both path sides cut to the same physical plane',turn,walkLength:len,worldRiser:rise*1.17,tread:run,bankStones:stoneCount,sourcePhotoUsedAsTexture:false};
}
