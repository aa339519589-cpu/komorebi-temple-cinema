import * as T from 'three';
import {createRootMoss108} from './scene03-root-surfaces108.js';

// Measured-looking garden volumes are still reconstruction hypotheses.
// Every planting position below is evaluated on an authored soil/rock body.
export function buildLivingBanks03({emit,at,between,box,mat,bankEarth,bankStone,routeStone=bankStone,bark,leaf,hallPlacement,stairPlacement,gardenAssets,rocks,bridgeModel,towerSite,reliefAt=()=>0}){
 let seed=10533872;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;},range=(a,b)=>a+(b-a)*rnd();
 const azaleaPink=[mat('azalea shell pink105','#d18aa0',.72),mat('azalea ivory blush105','#ead2c3',.77),mat('azalea deep rose105','#b96086',.78)];
 for(const m of azaleaPink)m.side=T.DoubleSide;
 const azaleaLeafMat=mat('azalea leathery foliage105','#3e612b',.69);azaleaLeafMat.side=T.DoubleSide;
 const leafGeometry=(()=>{const p=[],uv=[],indices=[],n=9;for(let j=0;j<=n;j++){const t=j/n,w=.015*Math.sin(Math.PI*t)**.73;for(const side of[-1,0,1]){p.push(side*w,.008*Math.sin(Math.PI*t)*(1-.85*Math.abs(side)),t*.063);uv.push((side+1)/2,t);}}for(let j=0;j<n;j++)for(let k=0;k<2;k++){const a=j*3+k;indices.push(a,a+3,a+1,a+1,a+3,a+4);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;})();
 const flowerGeometry=(()=>{const p=[],uv=[],ids=[],n=40,rings=7;for(let j=0;j<=rings;j++)for(let i=0;i<n;i++){const r=j/rings,a=i/n*Math.PI*2,rr=r*.041*(.67+.33*Math.cos(a*5));p.push(Math.cos(a)*rr,.020*(1-r)**2+.006*Math.sin(a*5)*r*r,Math.sin(a)*rr);uv.push(.5+Math.cos(a)*r*.5,.5+Math.sin(a)*r*.5);}for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;ids.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;})();
 const soilBodies=[],mossGeometry=Array.from({length:5},(_,i)=>createRootMoss108(i)),mossMaterial=mat('scene03-short-root-moss108','#687238',.93);mossMaterial.side=T.DoubleSide;
 let plantedShrubs=0,azaleaSprigs=0,irises=0,mossTufts108=0,embeddedOutcrops108=0;
 const flightMatrix=new T.Matrix4().makeTranslation(hallPlacement.x,0,hallPlacement.z-4).multiply(new T.Matrix4().makeRotationY(hallPlacement.yaw)).multiply(new T.Matrix4().makeTranslation(0,0,4)).multiply(new T.Matrix4().makeRotationY(stairPlacement.relativeYaw)).multiply(new T.Matrix4().makeTranslation(stairPlacement.centerX,0,0)),inverseFlight=flightMatrix.clone().invert(),
  pocket=new T.Vector3(4.216,2.25,4.369).applyMatrix4(inverseFlight),
  baseBankY=(x,z)=>stairPlacement.bottomWorldY+(4+hallPlacement.y-.11-stairPlacement.bottomWorldY)*Math.pow(T.MathUtils.clamp(1-(z-.22)/7.5,0,1),1.03)+.06*Math.sin(x*2.7+z*2.1),
  bankOffset=z=>.55*T.MathUtils.smoothstep((z-.22)/7,.20,.94),
  outerGroundY=z=>-.15+(stairPlacement.topWorldY-.24+.15)*(1-T.MathUtils.smoothstep(z,1.2,6.8))*T.MathUtils.smoothstep(z,-6,-1.6),
  lateralFraction=(x,z)=>T.MathUtils.clamp((Math.abs(x)-(stairPlacement.width/2+.12+bankOffset(z)))/(4.6+.24*Math.sin(z*1.1)),0,1),
  lateralBankY=(x,z)=>outerGroundY(z)+(baseBankY(x,z)-outerGroundY(z))*(1-T.MathUtils.smoothstep(lateralFraction(x,z),.28,1)),
  pocketDepth=Math.max(0,lateralBankY(pocket.x,pocket.z)-2.25),
  bankY=(x,z)=>lateralBankY(x,z)-pocketDepth*Math.exp(-(((x-pocket.x)/.62)**2+((z-pocket.z)/.67)**2))+.028*Math.sin(x*8.1+z*3.7)*Math.cos(z*5.3-x*2.1)*(1-T.MathUtils.smoothstep(lateralFraction(x,z),.85,1))+reliefAt(x,z),
  bridgeEndWorld=new T.Vector3(bridgeModel.span/2,1.13,0).applyMatrix4(new T.Matrix4().makeTranslation(...bridgeModel.position).multiply(new T.Matrix4().makeRotationY(bridgeModel.yaw))),
  bridgeEndLocal=bridgeEndWorld.clone().applyMatrix4(inverseFlight),routeEndZ=bridgeEndLocal.z,routeEndX=bridgeEndLocal.x,routeEndY=bridgeEndWorld.y,routeLength=routeEndZ-stairPlacement.run,towerLocal=new T.Vector3(...towerSite.position).applyMatrix4(inverseFlight),
  wingOuter=z=>stairPlacement.width/2+.12+bankOffset(z)+4.6+.24*Math.sin(z*1.1),wingWidth=z=>5.5*(.85+.15*Math.cos(z*.45)),
  wingY=(x,z)=>{const u=T.MathUtils.clamp((Math.abs(x)-wingOuter(z))/wingWidth(z),0,1),profile=-.15+(outerGroundY(z)+.15)*(1-T.MathUtils.smoothstep(u,0,1))+.025*Math.sin(x*3.7+z*4.5)*Math.sin(Math.PI*u),d=Math.hypot(x-towerLocal.x,z-towerLocal.z),siteTop=towerSite.position[1]-.10;return(profile>siteTop?siteTop+(profile-siteTop)*T.MathUtils.smoothstep(d,3.5,5.5):profile)+reliefAt(x,z);};
 if(!(routeLength>1&&routeLength<7))throw Error('Stair-to-bridge route requires a coherent positive physical span');
 function soilTriangle108(p,uv,a,b,c){
  // Project the independently scanned 3m material onto the actual dominant
  // face plane. A steep return must not stretch horizontal litter vertically.
  const n=new T.Vector3().subVectors(new T.Vector3(...b),new T.Vector3(...a)).cross(new T.Vector3().subVectors(new T.Vector3(...c),new T.Vector3(...a))),nn=[Math.abs(n.x),Math.abs(n.y),Math.abs(n.z)],axis=nn.indexOf(Math.max(...nn));
  for(const v of[a,b,c]){p.push(...v);uv.push((axis===0?v[2]:v[0])/3,(axis===1?v[2]:v[1])/3);}
 }
 function closedSurface(P,nX,nZ,baseY,tag){
  const p=[],uv=[],tri=(a,b,c)=>soilTriangle108(p,uv,a,b,c);
  for(let j=0;j<nZ;j++)for(let i=0;i<nX;i++){const a=P(i,j),b=P(i+1,j),c=P(i,j+1),d=P(i+1,j+1);tri(a,c,b);tri(b,c,d);}
  const border=[...Array.from({length:nX},(_,i)=>P(i,0)),...Array.from({length:nZ},(_,j)=>P(nX,j)),...Array.from({length:nX},(_,i)=>P(nX-i,nZ)),...Array.from({length:nZ},(_,j)=>P(0,nZ-j))];
  const centre=border.reduce((v,p)=>[v[0]+p[0]/border.length,baseY,v[2]+p[2]/border.length],[0,baseY,0]);
  for(let i=0;i<border.length;i++){const a=border[i],b=border[(i+1)%border.length],aa=[a[0],baseY,a[2]],bb=[b[0],baseY,b[2]];tri(a,b,aa);tri(b,bb,aa);tri(centre,aa,bb);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name=tag;g.userData.supportedGardenSoil={closedBody:true,bottomY:baseY,referencePhotoUsed:false};emit(g,bankEarth);soilBodies.push(tag);
 }
 function sprig(x,y,z,r=.6,h=.8,variant=0){
  const trunk=[x,y-.05,z],shoulder=[x+range(-.06,.06),y+h*.56,z+range(-.06,.06)];between(trunk,shoulder,.014,bark);
  for(let b=0;b<11;b++){const a=b*2.39996+range(-.35,.35),reach=r*range(.60,1.05),tip=[x+Math.cos(a)*reach,y+h*range(.62,1.1),z+Math.sin(a)*reach*.73],elbow=[x+Math.cos(a)*reach*.53,y+h*.62,z+Math.sin(a)*reach*.36];between(shoulder,elbow,.009,bark);between(elbow,tip,.005,bark);
   for(let k=0;k<38;k++){const t=range(.08,1.04),px=elbow[0]+(tip[0]-elbow[0])*t+range(-.10,.10),py=elbow[1]+(tip[1]-elbow[1])*t+range(-.06,.07),pz=elbow[2]+(tip[2]-elbow[2])*t+range(-.10,.10);emit(leafGeometry,azaleaLeafMat,[px,py,pz],[range(1.1,1.9),1,range(1.05,1.75)],[range(-.7,.5),a+range(-1.2,1.2),range(-.5,.5)],range(.80,1.17));
    if(variant%4!==1&&k%7===0&&b%3!==1)emit(flowerGeometry,azaleaPink[variant%3],[px+range(-.045,.045),py+.025,pz+range(-.045,.045)],[range(.8,1.2),1,range(.8,1.2)],[range(-.6,.6),range(0,6.28),range(-.4,.4)],range(.88,1.10));
   }
  }azaleaSprigs++;
 }
 function iris(x,y,z,height=1){
  const p=[],uv=[],ids=[];
  for(let b=0;b<19;b++){const a=b*2.39996,lean=range(.16,.62),h=height*range(.62,1.14),w=range(.025,.049),start=p.length/3;
   for(let j=0;j<=13;j++){const t=j/13,r=.035+lean*t*t,yy=h*t-.16*h*t**4,width=w*Math.sin(Math.PI*t*.96)**.52+.0004;for(const u of[-1,0,1]){p.push(Math.cos(a)*r+u*Math.sin(a)*width,yy+.018*(1-u*u)*Math.sin(Math.PI*t),Math.sin(a)*r-u*Math.cos(a)*width);uv.push((u+1)/2,t);}}
   for(let j=0;j<13;j++)for(let k=0;k<2;k++){const n=start+j*3+k;ids.push(n,n+3,n+1,n+1,n+3,n+4);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='rooted-sword-iris-fan105';emit(g,leaf,[x,y-.04,z]);irises++;
 }
 at([hallPlacement.x,0,hallPlacement.z-4],hallPlacement.yaw,()=>at([0,0,4],stairPlacement.relativeYaw,()=>at([stairPlacement.centerX,0,0],0,()=>{
  for(const side of[-1,1]){
   const inner=z=>stairPlacement.width/2+.12+bankOffset(z),nx=46,nz=93;
   // The side order keeps the top normal upwards on both turned banks.
   closedSurface((i,j)=>{const z=-1.6+9.3*j/nz,u=(side>0?i:nx-i)/nx,x=side*(inner(z)+(4.6+.24*Math.sin(z*1.1))*u);return[x,bankY(x,z)-.10,z];},nx,nz,-.48,`scene03-closed-${side<0?'west':'east'}-planted-slope105`);
   // The upper banks join real surrounding hillside instead of ending as
   // tall shelves or exposing an unrelated six-metre plinth wall. All three
   // outer/back/front boundaries descend below the existing ground plane.
   closedSurface((i,j)=>{const z=-6+13.7*j/56,u=(side>0?i:28-i)/28,inset=1-T.MathUtils.smoothstep(z,-2,.2),x=side*(wingOuter(z)-inset+(wingWidth(z)+inset)*u);return[x,wingY(x,z)-.10,z];},28,56,-.50,`scene03-closed-${side<0?'west':'east'}-outer-hillside107`);
   // Low full-scan outcrops belong to the continuous hill. Their buried
   // bottoms overlap its soil, breaking the former long bare earth faces.
   // These are broad strata and root pockets, rather than vertical piers.
   const retainedPlantSeed108=seed;seed=108781+(side>0?71:0);
   for(let row=0;row<6;row++)for(let k=0;k<7;k++){
    const z=-1.08+row*.77+range(-.13,.13),x=side*(inner(z)+.48+k*.63+range(-.14,.14)),y=bankY(x,z),w=range(.84,1.28),h=range(.28,.48),d=range(.71,1.04);
    if((x-pocket.x)**2+(z-pocket.z)**2<.67**2)continue;
    gardenAssets.plant('rockSolid',row+k,[x,y-.29,z],[w,h,d],[range(.09,.27),range(-.6,.6),side*range(-.07,.04)],range(.83,1.03));embeddedOutcrops108++;
   }
   for(let j=0;j<34;j++){
    const z=range(-2.3,4.6),x=side*(wingOuter(z)+range(.15,2.7)),y=wingY(x,z);
    gardenAssets.plant('rockSolid',j,[x,y-.27,z],[range(1.0,1.65),range(.31,.52),range(.78,1.23)],[range(.10,.28),range(0,6.28),range(-.12,.12)],range(.87,1.06));embeddedOutcrops108++;
   }
   seed=retainedPlantSeed108;
   for(let j=0;j<58;j++){
    const z=range(-3.8,6.8),x=side*(wingOuter(z)+range(.22,wingWidth(z)-.15)),y=wingY(x,z),s=range(.48,.90);
    gardenAssets.plant('rock',j,[x,y-.23,z],[s*1.4,s*.95,s*1.2],[range(-.1,.1),range(0,6.28),range(-.08,.08)],range(.84,1.05));
    if(j%2===0){gardenAssets.plant('shrub',j,[x,y-.17,z],[s,s,s],[range(-.06,.06),range(0,6.28),range(-.06,.06)],range(.85,1.04));plantedShrubs++;}
    for(let k=0;k<3;k++){const xx=x+range(-.25,.25),zz=z+range(-.22,.22);gardenAssets.plant('groundcover',j+k,[xx,wingY(xx,zz)-.115,zz],[range(1.0,1.6),range(.8,1.2),range(1.0,1.6)],[0,range(0,6.28),0],range(.85,1.04));}
   }
   for(let k=0;k<64;k++){
    const z=.35+7.0*((k*.61803398875)%1)+range(-.10,.10),x=side*(inner(z)+.14+3.95*((k*.41421356+.13)%1)),y=bankY(x,z),s=range(.45,1.04);
    // Cleavage faces are the exposed armour. Smaller original scan stones
    // sit in the rooted seams, rather than adding a new skin of boulders.
    gardenAssets.plant('rock',k,[x,y-.20,z],[s*1.18,s*.90,s*1.10],[range(-.13,.13),range(0,6.28),range(-.12,.12)],range(.85,1.04));
   }
   // Irregular mixed patches replace the former identical hemispheres.
   for(let b=0;b<43;b++){
    const z=range(.45,7.28),x=side*(inner(z)+range(.28,4.05)),y=bankY(x,z)-.14,s=range(.42,.94)*(z<2.4?1.05:.84),v=b%4;if((x-pocket.x)**2+(z-pocket.z)**2<.68**2)continue;
    gardenAssets.plant('shrub',v,[x,y,z],[s*range(.82,1.22),s*range(.8,1.07),s],[range(-.07,.07),range(0,6.28),range(-.06,.06)],range(.88,1.16));plantedShrubs++;
    for(let k=0;k<4;k++){const xx=x+range(-.44,.44),zz=z+range(-.38,.38);if(Math.abs(xx)<inner(zz)+.10)continue;gardenAssets.plant('groundcover',b+k,[xx,bankY(xx,zz)-.14,zz],[range(.85,1.5),range(.85,1.45),range(.85,1.5)],[range(-.10,.10),range(0,6.28),range(-.10,.10)],range(.84,1.04));}
    if(b%4!==1)sprig(x,y,z,range(.39,.72),range(.46,.92),b);
   }
   for(let i=0;i<10;i++){const z=.6+i*.65,x=side*(inner(z)+.28),y=bankY(x,z)-.08;gardenAssets.plant('groundcover',i,[x,y-.06,z],[2,1.7,2],[0,range(0,6.28),0],1.08);if(i%3===1)iris(x,y,z,range(.46,.72));}
   // Short seam plants use a shallow root insertion. Their 9–22 cm crowns
   // form a lower stratum on the same rough soil, below shrubs and iris.
   for(let j=0;j<120;j++){
    const z=range(.5,7.45),x=side*(inner(z)+range(.30,4.15));if((x-pocket.x)**2+(z-pocket.z)**2<.66**2)continue;
    gardenAssets.plant('groundcover',j,[x,bankY(x,z)-.115,z],[range(.8,1.2),range(.55,.78),range(.85,1.2)],[range(-.1,.1),range(0,6.28),range(-.1,.1)],range(.82,1.04));
   }
   // A much shorter stratum grows at the actual rock/soil interface. The
   // 14–41 mm fronds remain below the low groundcover and shrub crowns.
   const retainedApronSeed108=seed;seed=108317+(side>0?113:0);
   for(let j=0;j<330;j++){
    const z=range(-.8,7.4),x=side*(inner(z)+range(.23,4.28));if((x-pocket.x)**2+(z-pocket.z)**2<.66**2)continue;
    const s=range(.72,1.47);emit(mossGeometry[j%5],mossMaterial,[x,bankY(x,z)-.102,z],[s,s,s],[0,range(0,6.28),0],range(.77,1.22));mossTufts108++;
   }
   seed=retainedApronSeed108;
  }
  const apronLength=routeEndZ+.55-7.65,pathCentre=z=>routeEndX*T.MathUtils.clamp((z-7.8)/routeLength,0,1),pathY=z=>stairPlacement.bottomWorldY+(routeEndY-stairPlacement.bottomWorldY)*T.MathUtils.clamp((z-7.8)/routeLength,0,1),
   apronY=(x,z)=>{const t=T.MathUtils.clamp((z-7.65)/apronLength,0,1),base=(Math.max(-.11,bankY(x,7.65)-.04)+.11)*(1-t)**1.2-.11,ridge=pathY(z)*(1-T.MathUtils.smoothstep(Math.abs(x-pathCentre(z)),.55,1.05))*(1-T.MathUtils.smoothstep(z,routeEndZ,routeEndZ+.55));return Math.max(base,ridge)+.025*Math.sin(x*5+z*4)*(1-T.MathUtils.smoothstep(Math.abs(x),4.5,7.25))+reliefAt(x,z);};
  closedSurface((i,j)=>{const z=7.65+apronLength*j/26,x=(-1+2*i/32)*(7.4-3.3*j/26)*(1+.014*Math.sin(z*2.7));return[x,apronY(x,z)-.06,z];},32,26,-.50,'scene03-closed-stair-to-bridge-rock-apron105');
  for(let j=0;j<9;j++)for(let k=0;k<11;k++){
   const z=7.78+j*(apronLength-.30)/8+range(-.07,.07),x=-4.35+k*.84+range(-.15,.15),y=apronY(x,z),r=range(.43,.76);if(Math.abs(x-pathCentre(z))<.71)continue;
   if((j+k)%3===0)gardenAssets.plant('bearingRock',j+k,[x,y-.25,z],[r*1.5,r*.65,r*1.75],[range(-.10,.10),range(0,6.28),range(-.09,.09)],range(.84,1.05));
   else gardenAssets.plant('rock',j+k,[x,y-.21,z],[r*1.6,r*1.15,r*1.55],[range(-.08,.08),range(0,6.28),range(-.08,.08)],range(.88,1.05));
   if((j+k)%3===0)gardenAssets.plant('groundcover',j+k,[x,y-.09,z],[1.6,1.5,1.6],[0,range(0,6.28),0],1.08);
   if((j+k)%5===0)sprig(x,y,z,.39,.53,j+k);
  }
  // A walkable supported stone approach joins the raised stair foot to
  // the fixed bridge landing. Adjacent planting sits below this ridge.
  const pathCount=Math.ceil(routeLength/.268);for(let j=0;j<pathCount;j++){const z=7.82+j*routeLength/pathCount,y=pathY(z);box([pathCentre(z),y+.014,z],[1.04,.15,routeLength/pathCount+.025],routeStone,[0,Math.atan2(routeEndX,routeLength)+range(-.025,.025),0]);}
  // The real native ray at world(.844,1.151,8.733) exposed the steep soil
  // return beside the approach. These broad embedded scan solids carry
  // that return into the iris/bridge shoulder without invading the path.
  for(const [i,wx,wz]of[[0,.84,8.73],[1,1.30,8.65],[2,.56,8.26],[3,1.90,8.15],[4,1.0,9.20]]){
   const p=new T.Vector3(wx,0,wz).applyMatrix4(inverseFlight),centre=pathCentre(p.z),side=Math.sign(p.x-centre)||1,x=Math.abs(p.x-centre)<1.05?centre+side*1.05:p.x,y=apronY(x,p.z);
   gardenAssets.plant('rockSolid',i,[x,y-.29,p.z],[1.00,.57+.07*(i%2),.92],[.12,.23*i,-.06],.91+.035*(i%3));embeddedOutcrops108++;
  }
  // Close the former square cutoff at the outer bank ends with a real
  // tapered earth shoulder, stone masses and roots evaluated on its top.
  for(const sign of[-1,1])for(let j=0;j<23;j++){
   const z=range(7.8,routeEndZ-.5),t=(z-7.65)/apronLength,outer=7.4-3.3*t,x=sign*range(Math.min(4.4,outer-.7),outer-.24),y=apronY(x,z),r=range(.42,.74);
   gardenAssets.plant('rock',j,[x,y-.20,z],[r*1.65,r*1.15,r*1.6],[range(-.08,.08),range(0,6.28),range(-.08,.08)],range(.84,1.04));
   sprig(x,y-.08,z,range(.45,.72),range(.48,.77),j);
   gardenAssets.plant('groundcover',j,[x,y-.10,z],[1.9,1.6,1.9],[0,range(0,6.28),0],1.04);
  }
 })));
 // Independent closed mounds tie the right-bank lantern and iris roots to
 // the pond bed. They intersect the surrounding bank, not empty space.
 function mound(cx,cz,rx,rz,height,tag){
  const p=[],uv=[],N=64,R=20,shape=(t,a)=>{const x=cx+Math.cos(a)*rx*t,z=cz+Math.sin(a)*rz*t;return[x,-.11+height*(1-t*t)+.025*Math.sin(a*5)*Math.sin(Math.PI*t)+reliefAt(x,z),z];},tri=(a,b,c)=>soilTriangle108(p,uv,a,b,c);
  for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2,t=j/R,u=(j+1)/R,A=shape(t,a),B=shape(t,b),C=shape(u,a),D=shape(u,b);if(j)tri(A,B,C);tri(B,D,C);}
  for(let i=0;i<N;i++){const a=shape(1,i/N*Math.PI*2),b=shape(1,(i+1)/N*Math.PI*2),aa=[a[0],-.55,a[2]],bb=[b[0],-.55,b[2]];tri(a,b,aa);tri(b,bb,aa);tri([cx,-.55,cz],aa,bb);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name=tag;emit(g,bankEarth);soilBodies.push(tag);
  return(x,z)=>{const xx=(x-cx)/rx,zz=(z-cz)/rz,t=Math.min(1,Math.hypot(xx,zz)),a=Math.atan2(zz,xx);return-.11+height*(1-t*t)+.025*Math.sin(a*5)*Math.sin(Math.PI*t)+reliefAt(x,z);};
 }
 // The source bank rises into the bridge foot; a tall isolated pier was
 // the wrong mass even after changing its surface. This real closed rock
 // shoulder meets the pond bed and the retained approach/iris soil bodies.
 // It is derived from the same actual bridge endpoint as the walkable route.
 const shoulderCentre=[bridgeEndWorld.x+Math.sin(bridgeModel.yaw)*.18,bridgeEndWorld.z+Math.cos(bridgeModel.yaw)*.18],shoulderY=mound(...shoulderCentre,1.70,1.12,.55,'scene03-closed-coupled-bridge-foot-rock-shoulder108'),bridgeMatrix=new T.Matrix4().makeTranslation(...bridgeModel.position).multiply(new T.Matrix4().makeRotationY(bridgeModel.yaw)),inverseBridge=bridgeMatrix.clone().invert(),r=bridgeModel.deckDepth/1.94,heroes=[];
 // The exposed crest is actual full-UV mineral scan geometry. Broad green
 // soil above the joint stones was rejected in r03. The lower soil now
 // connects root pockets, and these closed boulders supply the rock shoulder.
 for(const [index,dx,z,bottom,width,height,depth,yaw]of[
  [2,.24,.73,-.28,1.43,1.00,1.06,.12],
  [4,.79,.28,-.31,1.65,.95,1.36,-.28],
  [0,-.27,.88,-.31,1.31,.55,1.04,.45],
  [1,.10,.36,.20,1.20,.50,1.15,-.19],
  [3,.86,.89,-.25,1.16,.49,.86,.53],
  [0,1.32,.48,-.28,1.22,.46,.96,-.16],
 ]){
  const p=new T.Vector3(bridgeModel.span/2+dx,bottom-bridgeModel.position[1],z*r).applyMatrix4(bridgeMatrix);
  gardenAssets.plant('rockSolid',index,p.toArray(),[width,height,depth],[0,bridgeModel.yaw+yaw,0],.92);heroes.push({x:p.x,z:p.z,radius:.46*Math.min(width,depth)});
 }
 for(let j=0;j<47;j++){
  const a=j*2.399963,t=range(.38,1.00),x=shoulderCentre[0]+Math.cos(a)*1.68*t,z=shoulderCentre[1]+Math.sin(a)*1.10*t,local=new T.Vector3(x,0,z).applyMatrix4(inverseBridge),underCap=Math.abs(local.x-bridgeModel.span/2)<.62&&Math.abs(local.z)<bridgeModel.deckDepth*.56;
  if(underCap||heroes.some(p=>(x-p.x)**2+(z-p.z)**2<p.radius*p.radius))continue;
  const y=shoulderY(x,z),s=range(.55,.92);
  gardenAssets.plant('rock',j,[x,y-.21,z],[s*1.1,s*.83,s*1.0],[range(-.12,.12),range(0,6.28),range(-.10,.10)],range(.84,1.03));
  if(j%2===0)gardenAssets.plant('groundcover',j,[x,y-.035,z],[range(.85,1.35),range(.60,.90),range(.9,1.35)],[0,range(0,6.28),0],range(.85,1.02));
  if(j%7===0)sprig(x,y-.035,z,.29,.37,j);
 }
 const eastY=mound(7.0,6.9,3.05,3.4,1.05,'scene03-connected-foreground-toro-bank105');
 for(let k=0;k<22;k++){
  const a=k*2.39996,t=range(.42,.98),x=7+Math.cos(a)*3*t,z=6.9+Math.sin(a)*3.3*t,y=eastY(x,z),s=range(.48,.95);gardenAssets.plant('rock',k,[x,y-.20,z],[s,s*.8,s],[0,range(0,6.28),0],range(.95,1.12));
  if(k%2===0){gardenAssets.plant('shrub',k,[x,y-.07,z],[.7,.7,.7],[0,range(0,6.28),0],range(.88,1.08));sprig(x,y,z,.68,.89,k);}
  for(let j=0;j<3;j++)gardenAssets.plant('groundcover',k+j,[x+range(-.18,.18),y-.05,z+range(-.18,.18)],[1.8,1.6,1.8],[0,range(0,6.28),0],1.08);
 }
 const irisY=mound(1.25,7.80,1.15,1.06,.65,'scene03-connected-bridge-iris-rock-pocket108');
 for(let k=0;k<11;k++){const a=k*2.39996,x=1.25+Math.cos(a)*range(.25,.88),z=7.80+Math.sin(a)*range(.25,.88),y=irisY(x,z),s=range(.38,.78);gardenAssets.plant('rock',k,[x,y-.19,z],[s,s*.95,s],[0,range(0,6.28),0],1.08);gardenAssets.plant('groundcover',k,[x,y-.01,z],[1.6,1.6,1.6],[0,range(0,6.28),0],1.1);}
 for(let k=0;k<21;k++){
  const a=k*2.39996,t=.18+.79*((k*.61803399)%1),x=1.25+Math.cos(a)*1.1*t,z=7.8+Math.sin(a)*1.01*t,y=irisY(x,z),w=.55+.30*((k*.41421356)%1);
  gardenAssets.plant('rockSolid',k,[x,y-.22,z],[w,.34+.09*(k%3),w*.88],[.10,k*.74,-.04],.90+.04*(k%3));
 }
 iris(1.18,irisY(1.18,7.82),7.82,1.43);iris(1.58,irisY(1.58,7.5),7.5,.91);
 // Footing rocks fit the two visible toro bases instead of merely placing
 // leaves around a shaft whose bottom had no bearing surface.
 gardenAssets.plant('rock',2,[6.25,.32,8.0],[2.0,.73,1.8],[0,.2,0],1.03);
 emit(rocks[3],bankStone,[4.216,1.77,4.369],[.72,.72,.72],[0,.35,0],1.06);
 return{info(){return{revision:'living-garden211-r13-low-bridge-shoulder',closedSoilBodies:soilBodies,route:{bridgeWorld:bridgeEndWorld.toArray(),bridgeInStairFrame:bridgeEndLocal.toArray(),length:routeLength},rootedShrubs:plantedShrubs,rootedAzaleaSprigs:azaleaSprigs,rootedIrisFans:irises,mossTufts108,embeddedOutcrops108,scannedAssets:gardenAssets.info(),stairOpeningPreserved:true,photographicAccepted:false};}};
}
