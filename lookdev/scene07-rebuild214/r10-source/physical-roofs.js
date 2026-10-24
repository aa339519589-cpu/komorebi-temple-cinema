import * as T from 'three';
import {clipRestorationRoofOpening} from './architecture-kernel.js';

// Authored construction geometry. The photograph is never sampled here.
// Dimensions are in the unscaled building coordinates; roof and frame share
// the same analytical surface so that the visible bearing members meet it.
export const PHYSICAL_ROOF_REVISION='scene07-seated-eave-and-aged-grey-ceramic214-r09';
const TAU=Math.PI*2;
const hash=(x,y=0)=>{const a=Math.sin(x*127.1+y*311.7+97.3)*43758.5453;return a-Math.floor(a);};

export function physicalRoofHeight153({w,d,e,rise,curl=.5,gabled=false,pagoda=false},x,z){
 const hw=w/2,hd=d/2,ridge=pagoda?w*.055:w*(gabled?.30:.24),cut=gabled?.43:0;
 let t=Math.abs(z)/hd,span=ridge+(hw-ridge)*(gabled?Math.max(0,(t-cut)/(1-cut)):t),u=x/span;
 if(Math.abs(x)>span){t=cut+(1-cut)*(Math.abs(x)-ridge)/(hw-ridge);u=z/(hd*t);}
 return e+rise*Math.pow(Math.max(0,1-t),gabled?1.72:1.49)+curl*Math.pow(t,10)*(.17+.83*Math.pow(Math.abs(u),8))+(gabled?.11:.035)*Math.pow(1-t,8)*Math.pow(Math.abs(u),8);
}

export function createRoofMaterials(){
  const n=128,albedo=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4),height=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=(y*n+x)*4,grain=hash(x,y),broad=.5+.25*Math.sin(x*.09+y*.031)+.25*Math.sin(x*.023-y*.077),q=.88+.095*broad+.025*grain;
    albedo[i]=Math.round(184*q);albedo[i+1]=Math.round(190*q);albedo[i+2]=Math.round(193*q);albedo[i+3]=255;
    const r=Math.round(140+38*broad+18*grain);rough[i]=rough[i+1]=rough[i+2]=r;rough[i+3]=255;
    const h=Math.round(126+10*grain+3*Math.sin(y*.7));height[i]=height[i+1]=height[i+2]=h;height[i+3]=255;
  }
  function tex(data,color=false){const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;if(color)t.colorSpace=T.SRGBColorSpace;return t;}
  const color=tex(albedo,true),roughness=tex(rough),bump=tex(height);
  // Combined linear pigment × neutral scan field now gives approximately
  // 8–12% diffuse reflectance, rather than the previous 6–8% charcoal.
  // This is aged grey ceramic, with the original physical glazed highlight.
  const ceramic=new T.MeshPhysicalMaterial({name:'scene07-aged-grey-fired-glaze',color:0x7b868b,map:color,roughness:.48,roughnessMap:roughness,bumpMap:bump,bumpScale:.020,metalness:.012,clearcoat:.36,clearcoatRoughness:.22});
  const worn=ceramic.clone();worn.name='scene07-worn-ceramic-ridges';worn.color.setHex(0x8a9591);worn.roughness=.67;worn.clearcoat=.22;
  const deck=new T.MeshStandardMaterial({name:'scene07-ceramic-bedding',color:0x343733,roughness:.91,bumpMap:bump,bumpScale:.022});
  return{ceramic,worn,deck,provenance:{source:'Scene-local authored geometry and mathematical PBR maps; no photo or external image sampled.',license:'Original project-authored source, no new third-party dependencies.',revision:PHYSICAL_ROOF_REVISION}};
}

function meshBuilder(){
  const positions=[],uv=[],indices=[];
  const vertex=(p,u=0,v=0)=>{const i=positions.length/3;positions.push(...p);uv.push(u,v);return i;};
  const tri=(a,b,c)=>{const ab=new T.Vector3(...b).sub(new T.Vector3(...a)),ac=new T.Vector3(...c).sub(new T.Vector3(...a));if(ab.cross(ac).lengthSq()<1e-17)return;const i=positions.length/3;for(const p of[a,b,c])vertex(p,p[0]*.7,p[2]*.7);indices.push(i,i+1,i+2);};
  const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
  const finish=()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;};
  return{vertex,positions,uv,indices,tri,quad,finish};
}

// Closed rectangular/round timber sweeps retain real caps at the eaves. All
// dimensions are physical sections, rather than screen-space ribbons.
function timber(points,width,height){
  const b=meshBuilder(),frames=points.map((p,i)=>{
    const c=new T.Vector3(...p),a=new T.Vector3(...points[Math.max(0,i-1)]),z=new T.Vector3(...points[Math.min(points.length-1,i+1)]),t=z.sub(a).normalize(),side=new T.Vector3(t.z,0,-t.x).normalize(),up=new T.Vector3().crossVectors(t,side).normalize();
    return{c,side,up};
  });
  const ring=f=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>f.c.clone().addScaledVector(f.side,x*width/2).addScaledVector(f.up,y*height/2).toArray());
  for(let i=0;i<frames.length-1;i++){const a=ring(frames[i]),c=ring(frames[i+1]);for(let j=0;j<4;j++){const k=(j+1)%4;b.quad(a[k],c[k],c[j],a[j]);}}
  const a=ring(frames[0]),c=ring(frames.at(-1));b.quad(a[3],a[2],a[1],a[0]);b.quad(c[0],c[1],c[2],c[3]);return b.finish();
}

function panelPrism(profile,depth,axis='x'){
  const s=new T.Shape(profile.map(p=>new T.Vector2(...p))),g=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:false,curveSegments:10});g.translate(0,0,-depth/2);
  if(axis==='x'){const p=g.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i),w=p.getZ(i);p.setXYZ(i,w,v,-u);}g.computeVertexNormals();}return g;
}

export function buildPhysicalRoof(api,{w,d,e,rise,curl=.5,gabled=false,pagoda=false,supports=[],label='roof',innerCollar=null}={}){
  const {emit,box,rod,bracket,materials}=api,hw=w/2,hd=d/2;
  const ridge=pagoda?w*.055:w*(gabled?.30:.24),cut=gabled?.43:0,exponent=gabled?1.72:1.49;
  const span=t=>ridge+(hw-ridge)*(gabled?Math.max(0,(t-cut)/(1-cut)):t);
  const P=(face,t,u)=>{
    const h=e+rise*Math.pow(Math.max(0,1-t),exponent)+curl*Math.pow(t,10)*(.17+.83*Math.pow(Math.abs(u),8))+(gabled?.11:.035)*Math.pow(1-t,8)*Math.pow(Math.abs(u),8);
    return face%2?[face===1?span(t):-span(t),h,u*hd*t]:[u*span(t),h,face===0?hd*t:-hd*t];
  };
  const frame=(face,t,u)=>{
    const c=new T.Vector3(...P(face,t,u)),a=new T.Vector3(...P(face,Math.max(cut&&face%2?cut:0,t-.0001),u)),b=new T.Vector3(...P(face,t+.0001,u)),tangent=b.sub(a).normalize(),across=new T.Vector3(...P(face,t,Math.min(1,u+.0001))).sub(new T.Vector3(...P(face,t,Math.max(-1,u-.0001)))).normalize();
    const up=new T.Vector3().crossVectors(tangent,across).normalize();if(up.y<0)up.negate();return{c,tangent,across,up};
  };
  const at=(face,t,u,offset=0)=>{const f=frame(face,t,u);return f.c.addScaledVector(f.up,offset).toArray();};
  const heightAt=(x,z)=>{
    let t=Math.abs(z)/hd,face=z>=0?0:2,u=x/span(t);
    if(Math.abs(x)>span(t)){t=(gabled?cut:0)+(1-(gabled?cut:0))*(Math.abs(x)-ridge)/(hw-ridge);face=x>=0?1:3;u=z/(hd*t);}
    return{p:P(face,t,u),face,t,u};
  };
  const roofBuckets=new Map();
  const draw=(g,m)=>{m=typeof m==='string'?(materials[m]||m):m;const key=typeof m==='string'?m:m.uuid;if(!roofBuckets.has(key))roofBuckets.set(key,{m,geometries:[]});roofBuckets.get(key).geometries.push(g);};
  const curve=(face,t,offset,count=48)=>Array.from({length:count+1},(_,i)=>at(face,t,-1+2*i/count,offset));
  const countTiles={cover:0,pan:0};
  for(let face=0;face<4;face++){
    const t0=gabled&&face%2?cut:.008,nu=Math.max(20,Math.ceil((face%2?d:w)/.30)),nt=32,deck=meshBuilder();
    for(let j=0;j<nt;j++)for(let i=0;i<nu;i++){
      const ta=t0+(1-t0)*j/nt,tb=t0+(1-t0)*(j+1)/nt,ua=-1+2*i/nu,ub=-1+2*(i+1)/nu;
      const a=at(face,ta,ua,0),b=at(face,ta,ub,0),c=at(face,tb,ub,0),q=at(face,tb,ua,0),aa=at(face,ta,ua,-.145),bb=at(face,ta,ub,-.145),cc=at(face,tb,ub,-.145),dd=at(face,tb,ua,-.145);
      const topUp=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a))).y>0;
      if(topUp){deck.quad(a,b,c,q);deck.quad(dd,cc,bb,aa);}else{deck.quad(q,c,b,a);deck.quad(aa,bb,cc,dd);}
      if(j===0)deck.quad(aa,bb,b,a);if(j===nt-1)deck.quad(q,c,cc,dd);
      if(i===0)deck.quad(a,q,dd,aa);if(i===nu-1)deck.quad(bb,cc,c,b);
    }
    draw(deck.finish(),'deck');

    // Pan tiles and covering rolls have separate closed shells. Their short
    // overlapping courses cast actual shadows and break the old uniform tube.
    const lanes=Math.ceil((face%2?d:w)/.205),rows=Math.max(10,Math.ceil((face%2?(hw-ridge):(hd))/.37)),covers=meshBuilder(),pans=meshBuilder();
    const tile=(out,ta,tb,ua,ub,cover,variant,metric=false)=>{
      const first=out.positions.length/3,nv=cover?8:4,along=3,thickness=cover?.027:.025;
      for(let layer=0;layer<2;layer++)for(let j=0;j<=along;j++)for(let k=0;k<=nv;k++){
        const t=ta+(tb-ta)*j/along,uu=ua+(ub-ua)*k/nv,u=metric?Math.max(-1,Math.min(1,uu/span(t))):uu,q=-1+2*k/nv,f=frame(face,t,u),crown=cover?.082*Math.sqrt(Math.max(0,1-q*q)):.039*q*q;
        // Low-amplitude, deterministic irregularity is in the fired clay,
        // not in the building outline or in a photograph-derived surface.
        const relief=.0055*Math.sin(q*4.1+variant*1.7+j*.8);
        const p=f.c.addScaledVector(f.up,.026+crown+relief-layer*thickness);out.vertex(p.toArray(),(k/nv)*.27,j/along*.48+variant*.137);
      }
      const row=nv+1,layerN=(along+1)*row,id=(l,j,k)=>first+l*layerN+j*row+k;
      const triangle=(a,b,c,up)=>{const p=out.positions,dy=(p[b*3+2]-p[a*3+2])*(p[c*3]-p[a*3])-(p[b*3]-p[a*3])*(p[c*3+2]-p[a*3+2]);if((dy>0)!==up)[b,c]=[c,b];out.indices.push(a,b,c);};
      for(let j=0;j<along;j++)for(let k=0;k<nv;k++){
        const a=id(0,j,k),b=id(0,j,k+1),c=id(0,j+1,k+1),d=id(0,j+1,k);triangle(a,b,c,true);triangle(a,c,d,true);
        const aa=id(1,j,k),bb=id(1,j,k+1),cc=id(1,j+1,k+1),dd=id(1,j+1,k);triangle(aa,cc,bb,false);triangle(aa,dd,cc,false);
      }
      for(let j=0;j<along;j++)for(const k of[0,nv]){const a=id(0,j,k),b=id(0,j+1,k),c=id(1,j+1,k),d=id(1,j,k);out.indices.push(a,b,c,a,c,d);}
      for(const j of[0,along])for(let k=0;k<nv;k++){const a=id(0,j,k),b=id(1,j,k),c=id(1,j,k+1),d=id(0,j,k+1);out.indices.push(a,b,c,a,c,d);}
      countTiles[cover?'cover':'pan']++;
    };
    for(let i=0;i<=lanes;i++)for(let j=0;j<rows;j++){
      const u=-1+2*i/lanes,ta=t0+(1-t0)*j/rows,tb=Math.min(1.012,t0+(1-t0)*(j+1.065)/rows),dw=.61/lanes;
      if(gabled&&face%2===0){
        // Parallel physical tile rolls run down the main roof. Outer rolls
        // end at the hip boundary; they do not all kink at the gable shoulder.
        const pitch=w/lanes,x=-hw+i*pitch,start=x=>Math.abs(x)<=ridge?t0:cut+(1-cut)*(Math.abs(x)-ridge)/(hw-ridge),ca=Math.max(ta,start(x));
        if(tb>ca+.0001)tile(covers,ca,tb,x-pitch*.305,x+pitch*.305,true,hash(i+face*97,j)*7,true);
        if(i<lanes){const a=x+pitch*.11,b=x+pitch*.89,near=a*b<=0?0:Math.min(Math.abs(a),Math.abs(b)),pa=Math.max(ta,start(near));if(tb>pa+.0001)tile(pans,pa,tb,a,b,false,hash(i+face*31,j)*11,true);}
      }else{
        tile(covers,ta,tb,Math.max(-1,u-dw),Math.min(1,u+dw),true,hash(i+face*97,j)*7);
        if(i<lanes){const ua=-1+2*i/lanes+.22/lanes,ub=-1+2*(i+1)/lanes-.22/lanes;tile(pans,ta,tb,ua,ub,false,hash(i+face*31,j)*11);}
      }
    }
    draw(pans.finish(),'ceramic');draw(covers.finish(),'ceramic');

    // Heavy curved fascia + compression moulding: the eave is a closed
    // layered assembly, with the rafter tips seated behind its lower lip.
    draw(timber(curve(face,1,-.18),.22,.25),'red');
    draw(timber(curve(face,1.008,-.31),.23,.105),'dark');
    draw(timber(curve(face,1.012,-.22),.032,.034),'gold');
    for(const t of[.58,.78,.92]){
      if(t<t0)continue;draw(timber(curve(face,t,-.45,32),.20,.20),'wood');
    }
    const rafters=Math.ceil((face%2?d:w)/.34);
    for(let i=0;i<=rafters;i++){
      const u=-1+2*i/rafters,start=Math.max(t0,.50),main=Array.from({length:15},(_,j)=>at(face,start+(1.006-start)*j/14,u,-.275));
      draw(timber(main,.16,.19),'red');
      const flying=Array.from({length:9},(_,j)=>at(face,.79+.216*j/8,u,-.205));draw(timber(flying,.125,.12),'red');
      const cap=flying.slice(-2);cap[0]=cap[1].map((q,k)=>q+(cap[0][k]-q)*.08);draw(timber(cap,.107,.106),'gold');
      // A short curved bracket sits beneath every fourth rafter and visibly
      // ties the deep flying eave back into the inner purlin line.
      if(i%4===0){
        const outer=at(face,.995,u,-.30),inner=at(face,.79,u,-.34),mid=at(face,.91,u,-.33);
        outer[1]-=.15;inner[1]-=.11;mid[1]-=.24;
        draw(timber([inner,mid,outer],.12,.13),'wood');
      }
    }
    // Hip rolls have real segmented ridge caps rather than one smooth pipe.
    for(const side of[-1,1]){
      const n=28;for(let j=0;j<n;j++){
        const ta=t0+(1-t0)*j/n,tb=Math.min(1.018,t0+(1-t0)*(j+1.06)/n),pts=Array.from({length:4},(_,k)=>at(face,ta+(tb-ta)*k/3,side,.112));
        draw(timber(pts,.16,.14),'worn');
      }
    }
  }

  // An annular lower roof meets an occupied upper storey. It has no hidden
  // ridge/ornaments crossing the floor or extending through the upper room.
  if(!innerCollar){
  // Ridge bedding, stacked ridge tiles and individual metal cramps.
  box(0,e+rise+.10,0,ridge*2+.20,.21,.35,'dark');
  const ridgeN=Math.max(3,Math.ceil(ridge*2/.28));
  for(let i=0;i<ridgeN;i++){
    const x=-ridge+(i+.5)*ridge*2/ridgeN;box(x,e+rise+.19,0,ridge*2/ridgeN*1.04,.17,.29,materials.worn);
    if(i%3===0){box(x,e+rise+.286,0,.033,.026,.32,'gold');box(x,e+rise+.17,.17,.033,.22,.025,'gold');}
  }
  if(gabled){
    // The gable is an enclosed timber diaphragm with actual king-post,
    // tie-beams and diagonal struts; no exposed blank triangular box face.
    const zmax=hd*cut,base=e+rise*Math.pow(1-cut,exponent)-.20;
    for(const side of[-1,1]){
      const profile=[[-zmax,base],[zmax,base]];for(let j=32;j>=0;j--){const z=-zmax+2*zmax*j/32;profile.push([z,e+rise*Math.pow(1-Math.abs(z)/hd,exponent)-.15]);}
      const panel=panelPrism(profile,.20);emit(panel,'dark',side*ridge,0,0);
      const outer=Array.from({length:41},(_,j)=>{const z=-zmax+2*zmax*j/40;return[side*(ridge+.13),e+rise*Math.pow(1-Math.abs(z)/hd,exponent)+.025,z];});
      draw(timber(outer,.25,.25),'red');
      const rim=outer.map(p=>[p[0]+side*.03,p[1]+.10,p[2]]);draw(timber(rim,.045,.055),'gold');
      for(const yy of[base+.13,base+.72,base+1.42]){
        const extent=hd*(1-Math.pow(Math.min(1,(yy+.16-e)/rise),1/exponent));if(extent>0)draw(timber([[side*(ridge+.15),yy,-Math.min(zmax,extent)],[side*(ridge+.15),yy,Math.min(zmax,extent)]],.22,.19),'red');
      }
      for(let k=-4;k<=4;k++){
        const z=k*zmax/4.6,top=e+rise*Math.pow(1-Math.abs(z)/hd,exponent)-.27;if(top>base+.13)box(side*(ridge+.16),(base+.13+top)/2,z,.16,top-base-.13,.11,'red');
      }
      for(const sign of[-1,1]){
        const a=[side*(ridge+.21),base+.16,sign*zmax*.82],b=[side*(ridge+.21),e+rise-.48,0];draw(timber([a,b],.17,.15),'wood');
        box(side*(ridge+.24),base+.15,sign*zmax*.82,.045,.25,.23,'gold');
      }
    }
  }
  // Broad three-dimensional shibi silhouettes, ceramic core with a restrained
  // brass leading edge. Their S-shaped body is not a wire hook or billboard.
  if(!pagoda)for(const side of[-1,1]){
    const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.18,.03,.38,.16,.40,.40);shape.bezierCurveTo(.42,.65,.27,.79,.15,.82);shape.bezierCurveTo(.28,.63,.26,.51,.17,.42);shape.bezierCurveTo(.10,.32,-.05,.24,-.09,.13);shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:.17,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.02,bevelSegments:2,curveSegments:12});g.translate(0,0,-.085);emit(g,materials.worn,side*ridge,e+rise+.22,0,side,1,1);
    const points=[[side*ridge,e+rise+.25,.105],[side*(ridge+.24),e+rise+.41,.105],[side*(ridge+.33),e+rise+.69,.105],[side*(ridge+.15),e+rise+1.03,.105]];
    for(let j=0;j<points.length-1;j++)rod(points[j],points[j+1],.027,'gold');
  }
  }
  // Seat the roof to its actual old column/bracket grid with continuous
  // receiver beams and short bearing blocks, not decorative floating bands.
  for(const s of supports){
    const points=s.xs.map(x=>{const q=heightAt(x,s.z);return[x,q.p[1]-.42,s.z];});draw(timber(points,.25,.22),'wood');
    for(const x of s.xs){const q=heightAt(x,s.z),top=q.p[1]-.42,bottom=s.head;
      const inside=innerCollar&&x>innerCollar.minX&&x<innerCollar.maxX&&s.z>innerCollar.minZ&&s.z<innerCollar.maxZ;
      if(!inside&&top>bottom-.03)box(x,(bottom+top)/2,s.z,.28,Math.max(.08,top-bottom),.30,'red');
      // Transverse receiver contacts the closed main-rafter assembly.
      if(!inside)box(x,top+.07,s.z,.44,.14,.37,'wood');
    }
  }
  for(const {m,geometries}of roofBuckets.values()){
    const vertices=geometries.reduce((n,g)=>n+g.attributes.position.count,0),indexCount=geometries.reduce((n,g)=>n+(g.index?.count??g.attributes.position.count),0),p=new Float32Array(vertices*3),n=new Float32Array(vertices*3),uv=new Float32Array(vertices*2),ix=new Uint32Array(indexCount);let v=0,k=0;
    for(const g of geometries){p.set(g.attributes.position.array,v*3);n.set(g.attributes.normal.array,v*3);uv.set(g.attributes.uv.array,v*2);for(let j=0,N=g.index?.count??g.attributes.position.count;j<N;j++)ix[k++]=v+(g.index?g.index.getX(j):j);v+=g.attributes.position.count;g.dispose();}
    let g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(ix,1));g.userData.architectureMember=label;
    if(innerCollar){const original=g;g=clipRestorationRoofOpening(original,innerCollar);original.dispose();}
    if(g.attributes.position.count)emit(g,m,0,0,0);else g.dispose();
  }
  if(innerCollar){
    // The ends of the cut bedding/tiles/rafters are housed in a real closed
    // timber curb, following the analytical roof height around all four faces.
    // This makes the upper floor a separate occupied volume, not a box pushed
    // through an intact roof. The curb also closes the former bright attic gap.
    const {minX,maxX,minZ,maxZ,topY}=innerCollar,b=meshBuilder(),thickness=.18;
    const edge=(a,c,n)=>{const steps=Math.max(8,Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/.22));
      for(let j=0;j<steps;j++){
        const pa=a.map((v,k)=>v+(c[k]-v)*j/steps),pc=a.map((v,k)=>v+(c[k]-v)*(j+1)/steps);
        const ya=heightAt(pa[0],pa[1]).p[1]-.22,yc=heightAt(pc[0],pc[1]).p[1]-.22;
        const corners=(p,y)=>[[p[0]-n[0]*thickness*.5,y,p[1]-n[1]*thickness*.5],[p[0]+n[0]*thickness*.5,y,p[1]+n[1]*thickness*.5],[p[0]+n[0]*thickness*.5,topY,p[1]+n[1]*thickness*.5],[p[0]-n[0]*thickness*.5,topY,p[1]-n[1]*thickness*.5]];
        const aa=corners(pa,ya),cc=corners(pc,yc);for(let k=0;k<4;k++)b.quad(aa[k],cc[k],cc[(k+1)%4],aa[(k+1)%4]);b.quad(aa[3],aa[2],aa[1],aa[0]);b.quad(cc[0],cc[1],cc[2],cc[3]);
      }
    };
    edge([minX,minZ],[maxX,minZ],[0,1]);edge([maxX,minZ],[maxX,maxZ],[1,0]);edge([maxX,maxZ],[minX,maxZ],[0,1]);edge([minX,maxZ],[minX,minZ],[1,0]);
    const curb=b.finish();curb.userData.architectureMember=label+'-closed-collar';emit(curb,'wood',0,0,0);
  }
  return{revision:PHYSICAL_ROOF_REVISION,label,width:w,depth:d,eave:e,peak:e+rise,tiles:countTiles,innerCollar,construction:'Closed curved bedding; individual pan/cover courses; fascia, purlins and capped rafters; seated receivers. Lower hall roof is cut at its upper-room footprint and housed in a closed fitted timber curb.'};
}
