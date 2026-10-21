import * as T from 'three';

// Authored construction geometry. The photograph is never sampled here.
// Dimensions are in the unscaled building coordinates; roof and frame share
// the same analytical surface so that the visible bearing members meet it.
export const PHYSICAL_ROOF_REVISION='scene09-deep-chamfered-eaves145';
const TAU=Math.PI*2;
const hash=(x,y=0)=>{const a=Math.sin(x*127.1+y*311.7+97.3)*43758.5453;return a-Math.floor(a);};

export function createRoofMaterials(){
  const n=128,albedo=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4),height=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=(y*n+x)*4,grain=hash(x,y),broad=.5+.25*Math.sin(x*.09+y*.031)+.25*Math.sin(x*.023-y*.077),q=.83+.13*broad+.04*grain;
    albedo[i]=Math.round(184*q);albedo[i+1]=Math.round(190*q);albedo[i+2]=Math.round(193*q);albedo[i+3]=255;
    const r=Math.round(140+38*broad+18*grain);rough[i]=rough[i+1]=rough[i+2]=r;rough[i+3]=255;
    const h=Math.round(126+10*grain+3*Math.sin(y*.7));height[i]=height[i+1]=height[i+2]=h;height[i+3]=255;
  }
  function tex(data,color=false){const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;if(color)t.colorSpace=T.SRGBColorSpace;return t;}
  const color=tex(albedo,true),roughness=tex(rough),bump=tex(height);
  const ceramic=new T.MeshPhysicalMaterial({name:'scene07-charcoal-fired-glaze',color:0x4b555a,map:color,roughness:.72,roughnessMap:roughness,bumpMap:bump,bumpScale:.006,metalness:.015,clearcoat:.23,clearcoatRoughness:.29});
  const worn=ceramic.clone();worn.name='scene07-worn-ceramic-ridges';worn.color.setHex(0x4c5353);worn.roughness=.80;worn.clearcoat=.15;
  const deck=new T.MeshStandardMaterial({name:'scene07-ceramic-bedding',color:0x272b29,roughness:.94,bumpMap:bump,bumpScale:.018});
  return{ceramic,worn,deck,provenance:{source:'Scene-local authored geometry and mathematical PBR maps; no photo or external image sampled.',license:'Original project-authored source, no new third-party dependencies.',revision:PHYSICAL_ROOF_REVISION}};
}

function meshBuilder(){
  const positions=[],uv=[],indices=[],colors=[];
  const vertex=(p,u=0,v=0)=>{const i=positions.length/3;positions.push(...p);uv.push(u,v);colors.push(1,1,1);return i;};
  const tri=(a,b,c)=>{const ab=new T.Vector3(...b).sub(new T.Vector3(...a)),ac=new T.Vector3(...c).sub(new T.Vector3(...a));if(ab.cross(ac).lengthSq()<1e-17)return;const i=positions.length/3;for(const p of[a,b,c])vertex(p,p[0]*.7,p[2]*.7);indices.push(i,i+1,i+2);};
  const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
  const finish=()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;};
  return{vertex,positions,uv,indices,colors,tri,quad,finish};
}

// Closed rectangular/round timber sweeps retain real caps at the eaves. All
// dimensions are physical sections, rather than screen-space ribbons.
function timber(points,width,height){
  const b=meshBuilder(),frames=points.map((p,i)=>{
    const c=new T.Vector3(...p),a=new T.Vector3(...points[Math.max(0,i-1)]),z=new T.Vector3(...points[Math.min(points.length-1,i+1)]),t=z.sub(a).normalize(),side=new T.Vector3(t.z,0,-t.x).normalize(),up=new T.Vector3().crossVectors(t,side).normalize();
    return{c,side,up};
  });
  const c=Math.min(.010,width*.14,height*.14),w=width/2,h=height/2,profile=[[-w+c,-h],[w-c,-h],[w,-h+c],[w,h-c],[w-c,h],[-w+c,h],[-w,h-c],[-w,-h+c]];
  const ring=f=>profile.map(([x,y])=>f.c.clone().addScaledVector(f.side,x).addScaledVector(f.up,y).toArray());
  for(let i=0;i<frames.length-1;i++){const a=ring(frames[i]),c=ring(frames[i+1]);for(let j=0;j<8;j++){const k=(j+1)%8;b.quad(a[k],c[k],c[j],a[j]);}}
  const a=ring(frames[0]),z=ring(frames.at(-1));for(let i=0;i<8;i++){const j=(i+1)%8;b.tri(frames[0].c.toArray(),a[j],a[i]);b.tri(frames.at(-1).c.toArray(),z[i],z[j]);}return b.finish();
}

function panelPrism(profile,depth,axis='x'){
  const s=new T.Shape(profile.map(p=>new T.Vector2(...p))),g=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:false,curveSegments:10});g.translate(0,0,-depth/2);
  if(axis==='x'){const p=g.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i),w=p.getZ(i);p.setXYZ(i,w,v,-u);}g.computeVertexNormals();}return g;
}

export function buildPhysicalRoof(api,{w,d,e,rise,curl=.5,gabled=false,pagoda=false,supports=[],label='roof',frontDepth=null,backDepth=null,ridgeLeft=null,ridgeRight=null,inner=0,gableCut=.43,slopePower=null,ornamentHeight=1}={}){
  const {emit,box,rod,bracket,materials}=api,hw=w/2,hd=frontDepth??d/2,bd=backDepth??d/2;
  const ridge=pagoda?w*.055:w*(gabled?.30:.24),rl=ridgeLeft??ridge,rr=ridgeRight??ridge,cut=gabled?gableCut:0,exponent=slopePower??(gabled?1.72:1.49);
  const span=(t,side=1)=>{const r=side<0?rl:rr;return r+(hw-r)*(gabled?Math.max(0,(t-cut)/(1-cut)):t);};
  const P=(face,t,u)=>{
    const h=e+rise*Math.pow(Math.max(0,1-t),exponent)+curl*Math.pow(t,10)*(.17+.83*Math.pow(Math.abs(u),8))+(gabled?.11:.035)*Math.pow(1-t,8)*Math.pow(Math.abs(u),8);
    return face%2?[face===1?span(t,1):-span(t,-1),h,u*(u>=0?hd:bd)*t]:[-span(t,-1)+(u+1)/2*(span(t,-1)+span(t,1)),h,(face===0?hd:-bd)*t];
  };
  const frame=(face,t,u)=>{
    const c=new T.Vector3(...P(face,t,u)),a=new T.Vector3(...P(face,Math.max(cut&&face%2?cut:0,t-.0001),u)),b=new T.Vector3(...P(face,t+.0001,u)),tangent=b.sub(a).normalize(),across=new T.Vector3(...P(face,t,Math.min(1,u+.0001))).sub(new T.Vector3(...P(face,t,Math.max(-1,u-.0001)))).normalize();
    const up=new T.Vector3().crossVectors(tangent,across).normalize();if(up.y<0)up.negate();return{c,tangent,across,up};
  };
  const at=(face,t,u,offset=0)=>{const f=frame(face,t,u);return f.c.addScaledVector(f.up,offset).toArray();};
  const heightAt=(x,z)=>{
    let t=Math.abs(z)/(z>=0?hd:bd),face=z>=0?0:2,u=(2*x+span(t,-1)-span(t,1))/(span(t,-1)+span(t,1));
    if(x>span(t,1)||x< -span(t,-1)){const r=x>=0?rr:rl;t=(gabled?cut:0)+(1-(gabled?cut:0))*(Math.abs(x)-r)/(hw-r);face=x>=0?1:3;u=z/((z>=0?hd:bd)*t);}
    return{p:P(face,t,u),face,t,u};
  };
  const roofBuckets=new Map();
  const draw=(g,m)=>{m=typeof m==='string'?(materials[m]||m):m;const key=typeof m==='string'?m:m.uuid;if(!roofBuckets.has(key))roofBuckets.set(key,{m,geometries:[]});roofBuckets.get(key).geometries.push(g);};
  const curve=(face,t,offset,count=48)=>Array.from({length:count+1},(_,i)=>at(face,t,-1+2*i/count,offset));
  const countTiles={cover:0,pan:0};
  for(let face=0;face<4;face++){
    const t0=Math.max(inner,gabled&&face%2?cut:.008),nu=Math.max(20,Math.ceil((face%2?hd+bd:w)/.30)),nt=32,deck=meshBuilder();
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
    const lanes=Math.ceil((face%2?hd+bd:w)/.205),rows=Math.max(10,Math.ceil((face%2?(hw-(face===1?rr:rl)):(face===0?hd:bd))/.37)),covers=meshBuilder(),pans=meshBuilder();
    const tile=(out,ta,tb,ua,ub,cover,variant,metric=false)=>{
      const first=out.positions.length/3,nv=cover?8:4,along=3,thickness=cover?.018:.021;
      for(let layer=0;layer<2;layer++)for(let j=0;j<=along;j++)for(let k=0;k<=nv;k++){
        const t=ta+(tb-ta)*j/along,uu=ua+(ub-ua)*k/nv,u=metric?Math.max(-1,Math.min(1,(2*uu+span(t,-1)-span(t,1))/(span(t,-1)+span(t,1)))):uu,q=-1+2*k/nv,f=frame(face,t,u),crown=cover?.065*Math.sqrt(Math.max(0,1-q*q)):.035*q*q;
        // Low-amplitude, deterministic irregularity is in the fired clay,
        // not in the building outline or in a photograph-derived surface.
        const relief=.0025*Math.sin(q*4.1+variant*1.7+j*.8);
        const p=f.c.addScaledVector(f.up,.026+crown+relief-layer*thickness);const id=out.vertex(p.toArray(),(k/nv)*.27,j/along*.48+variant*.137),tone=.82+.23*hash(variant*17,Math.floor(ta*101))+.025*Math.sin(k*1.7+j);out.colors[id*3]=tone*.97;out.colors[id*3+1]=tone;out.colors[id*3+2]=tone*1.025;
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
        const pitch=w/lanes,x=-hw+i*pitch,start=x=>{const r=x>=0?rr:rl;return Math.abs(x)<=r?t0:cut+(1-cut)*(Math.abs(x)-r)/(hw-r);},ca=Math.max(ta,start(x));
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
    draw(timber(curve(face,1,-.18),.28,.31),'wood');
    draw(timber(curve(face,.985,-.43),.30,.20),'wood');
    draw(timber(curve(face,1.008,-.36),.25,.12),'dark');
    draw(timber(curve(face,1.012,-.22),.032,.034),'gold');if(api.ornament){const n=Math.ceil((face%2?hd+bd:w)/.40);for(let i=0;i<=n;i++){const p=at(face,1,-1+2*i/n,-.18);api.ornament(p,face,.070);}}
    for(const t of[.58,.78,.92]){
      if(t<t0)continue;draw(timber(curve(face,t,-.46,32),.27,.24),'wood');
    }
    const rafters=Math.ceil((face%2?hd+bd:w)/.22);
    for(let i=0;i<=rafters;i++){
      const u=-1+2*i/rafters,start=Math.max(t0,.50),main=Array.from({length:15},(_,j)=>at(face,start+(1.014-start)*j/14,u,-.275));
      draw(timber(main,.145,.18),'wood');
      const flying=Array.from({length:9},(_,j)=>at(face,.79+.223*j/8,u,-.245));draw(timber(flying,.105,.125),'wood');
      const cap=flying.slice(-2);cap[0]=cap[1].map((q,k)=>q+(cap[0][k]-q)*.08);draw(timber(cap,.108,.128),i%4===0?'gold':'wood');
    }
    // Hip rolls have real segmented ridge caps rather than one smooth pipe.
    for(const side of[-1,1]){
      const n=28;for(let j=0;j<n;j++){
        const ta=t0+(1-t0)*j/n,tb=Math.min(1.018,t0+(1-t0)*(j+1.06)/n),pts=Array.from({length:4},(_,k)=>at(face,ta+(tb-ta)*k/3,side,.112));
        draw(timber(pts,.16,.14),'worn');
      }
    }
  }

  if(inner===0){
  // Ridge bedding, stacked ridge tiles and individual metal cramps.
  box((rr-rl)/2,e+rise+.10,0,rr+rl+.20,.21,.35,'dark');
  const ridgeN=Math.max(3,Math.ceil((rl+rr)/.28));
  for(let i=0;i<ridgeN;i++){
    const x=-rl+(i+.5)*(rl+rr)/ridgeN;box(x,e+rise+.19,0,(rl+rr)/ridgeN*1.04,.17,.29,materials.worn);
    if(i%3===0){box(x,e+rise+.286,0,.033,.026,.32,'gold');box(x,e+rise+.17,.17,.033,.22,.025,'gold');}
  }
  if(gabled){
    const z0=-bd*cut,z1=hd*cut,base=e+rise*Math.pow(1-cut,exponent)-.20;
    const top=z=>e+rise*Math.pow(1-Math.abs(z)/(z>=0?hd:bd),exponent);
    for(const side of[-1,1]){
      const rx=side>0?rr:-rl,profile=[[z0,base],[z1,base]];
      for(let j=32;j>=0;j--){const z=z0+(z1-z0)*j/32;profile.push([z,top(z)-.15]);}
      emit(panelPrism(profile,.20),'dark',rx,0,0);
      const outer=Array.from({length:41},(_,j)=>{const z=z0+(z1-z0)*j/40;return[rx+side*.13,top(z)+.025,z];});
      draw(timber(outer,.25,.25),'red');draw(timber(outer.map(p=>[p[0]+side*.03,p[1]+.10,p[2]]),.045,.055),'gold');
      for(const yy of[base+.13,base+.72,base+1.42]){
        const q=1-Math.pow(Math.min(1,(yy+.16-e)/rise),1/exponent),a=Math.max(z0,-bd*q),b=Math.min(z1,hd*q);
        if(b>a)draw(timber([[rx+side*.15,yy,a],[rx+side*.15,yy,b]],.22,.19),'red');
      }
      for(let k=0;k<=8;k++){const z=z0+(z1-z0)*(.08+.84*k/8),h=top(z)-.27;if(h>base+.13)box(rx+side*.16,(base+.13+h)/2,z,.16,h-base-.13,.11,'red');}
      for(const z of[z0*.82,z1*.82])draw(timber([[rx+side*.21,base+.16,z],[rx+side*.21,e+rise-.48,0]],.17,.15),'wood');
    }
  }
  // Broad three-dimensional shibi silhouettes, ceramic core with a restrained
  // brass leading edge. Their S-shaped body is not a wire hook or billboard.
  if(!pagoda)for(const side of[-1,1]){
    const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.18,.03,.38,.16,.40,.40);shape.bezierCurveTo(.42,.65,.27,.79,.15,.82);shape.bezierCurveTo(.28,.63,.26,.51,.17,.42);shape.bezierCurveTo(.10,.32,-.05,.24,-.09,.13);shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:.17,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.02,bevelSegments:2,curveSegments:12});g.translate(0,0,-.085);emit(g,materials.worn,(side>0?rr:-rl),e+rise+.22,0,side,ornamentHeight,1);
    const points=[[(side>0?rr:-rl),e+rise+.22+.03*ornamentHeight,.105],[(side>0?rr+.24:-rl-.24),e+rise+.22+.19*ornamentHeight,.105],[(side>0?rr+.33:-rl-.33),e+rise+.22+.47*ornamentHeight,.105],[(side>0?rr+.15:-rl-.15),e+rise+.22+.81*ornamentHeight,.105]];
    for(let j=0;j<points.length-1;j++)rod(points[j],points[j+1],.027,'gold');
  }
  } // Open lower skirt has no phantom ridge above its real central opening.
  // Seat the roof to its actual old column/bracket grid with continuous
  // receiver beams and short bearing blocks, not decorative floating bands.
  for(const s of supports){
    const points=s.xs.map(x=>{const q=heightAt(x,s.z);return[x,q.p[1]-.42,s.z];});draw(timber(points,.25,.22),'wood');
    for(const x of s.xs){const q=heightAt(x,s.z),top=q.p[1]-.42,bottom=s.head;
      if(top>bottom-.03)box(x,(bottom+top)/2,s.z,.28,Math.max(.08,top-bottom),.30,'red');
      // Transverse receiver contacts the closed main-rafter assembly.
      box(x,top+.07,s.z,.44,.14,.37,'wood');
    }
  }
  for(const {m,geometries}of roofBuckets.values()){
    const vertices=geometries.reduce((n,g)=>n+g.attributes.position.count,0),indexCount=geometries.reduce((n,g)=>n+(g.index?.count??g.attributes.position.count),0),p=new Float32Array(vertices*3),n=new Float32Array(vertices*3),uv=new Float32Array(vertices*2),colors=new Float32Array(vertices*3).fill(1),ix=new Uint32Array(indexCount);let v=0,k=0;
    for(const g of geometries){p.set(g.attributes.position.array,v*3);n.set(g.attributes.normal.array,v*3);uv.set(g.attributes.uv.array,v*2);if(g.attributes.color)colors.set(g.attributes.color.array,v*3);for(let j=0,N=g.index?.count??g.attributes.position.count;j<N;j++)ix[k++]=v+(g.index?g.index.getX(j):j);v+=g.attributes.position.count;g.dispose();}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('color',new T.BufferAttribute(colors,3));g.setIndex(new T.BufferAttribute(ix,1));g.userData.architectureMember=label;emit(g,m,0,0,0);
  }
  return{revision:PHYSICAL_ROOF_REVISION,label,width:w,frontDepth:hd,backDepth:bd,ridgeLeft:rl,ridgeRight:rr,innerOpening:inner,eave:e,peak:e+rise,tiles:countTiles,construction:'Closed curved bedding; individual closed pan/cover courses; closed fascia, purlins, twin capped rafters, seated receiver beams; solid gable truss and ridge ornaments.'};
}
