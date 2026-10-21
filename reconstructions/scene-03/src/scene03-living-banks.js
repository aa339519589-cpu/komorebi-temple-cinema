import * as T from 'three';

// Measured-looking garden volumes are still reconstruction hypotheses.
// Every planting position below is evaluated on an authored soil/rock body.
export function buildLivingBanks03({emit,at,between,box,mat,bankEarth,bankStone,bark,leaf,hallPlacement,stairPlacement,gardenAssets,rocks,bridgeModel}){
 let seed=10533872;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;},range=(a,b)=>a+(b-a)*rnd();
 const azaleaPink=[mat('azalea shell pink105','#e8a0b7',.72),mat('azalea ivory blush105','#f4d9d1',.77),mat('azalea deep rose105','#bd6d92',.78)];
 for(const m of azaleaPink)m.side=T.DoubleSide;
 const azaleaLeafMat=mat('azalea leathery foliage105','#3e612b',.69);azaleaLeafMat.side=T.DoubleSide;
 const leafGeometry=(()=>{const p=[],uv=[],indices=[],n=9;for(let j=0;j<=n;j++){const t=j/n,w=.032*Math.sin(Math.PI*t)**.73;for(const side of[-1,0,1]){p.push(side*w,.014*Math.sin(Math.PI*t)*(1-.85*Math.abs(side)),t*.12);uv.push((side+1)/2,t);}}for(let j=0;j<n;j++)for(let k=0;k<2;k++){const a=j*3+k;indices.push(a,a+3,a+1,a+1,a+3,a+4);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;})();
 const flowerGeometry=(()=>{const p=[],uv=[],ids=[],n=40,rings=7;for(let j=0;j<=rings;j++)for(let i=0;i<n;i++){const r=j/rings,a=i/n*Math.PI*2,rr=r*.041*(.67+.33*Math.cos(a*5));p.push(Math.cos(a)*rr,.020*(1-r)**2+.006*Math.sin(a*5)*r*r,Math.sin(a)*rr);uv.push(.5+Math.cos(a)*r*.5,.5+Math.sin(a)*r*.5);}for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;ids.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;})();
 const soilBodies=[];let plantedShrubs=0,azaleaSprigs=0,irises=0;
 const flightMatrix=new T.Matrix4().makeTranslation(hallPlacement.x,0,hallPlacement.z-4).multiply(new T.Matrix4().makeRotationY(hallPlacement.yaw)).multiply(new T.Matrix4().makeTranslation(0,0,4)).multiply(new T.Matrix4().makeRotationY(stairPlacement.relativeYaw)).multiply(new T.Matrix4().makeTranslation(stairPlacement.centerX,0,0)),inverseFlight=flightMatrix.clone().invert(),
  pocket=new T.Vector3(4.216,2.25,4.369).applyMatrix4(inverseFlight),
  baseBankY=(x,z)=>stairPlacement.bottomWorldY+(4+hallPlacement.y-.11-stairPlacement.bottomWorldY)*Math.pow(Math.max(0,1-(z-.22)/7.5),1.03)+.06*Math.sin(x*2.7+z*2.1),
  pocketDepth=Math.max(0,baseBankY(pocket.x,pocket.z)-2.25),
  bankOffset=z=>.55*T.MathUtils.smoothstep((z-.22)/7,.20,.94),
  bankY=(x,z)=>baseBankY(x,z)-pocketDepth*Math.exp(-(((x-pocket.x)/.62)**2+((z-pocket.z)/.67)**2)),
  bridgeEndWorld=new T.Vector3(bridgeModel.span/2,1.13,0).applyMatrix4(new T.Matrix4().makeTranslation(...bridgeModel.position).multiply(new T.Matrix4().makeRotationY(bridgeModel.yaw))),
  bridgeEndLocal=bridgeEndWorld.clone().applyMatrix4(inverseFlight),routeEndZ=bridgeEndLocal.z,routeEndX=bridgeEndLocal.x,routeEndY=bridgeEndWorld.y,routeLength=routeEndZ-stairPlacement.run;
 if(!(routeLength>1&&routeLength<7))throw Error('Stair-to-bridge route requires a coherent positive physical span');
 function closedSurface(P,nX,nZ,baseY,tag){
  const p=[],uv=[],tri=(a,b,c)=>{for(const v of[a,b,c]){p.push(...v);uv.push(v[0]*1.8,v[2]*1.8);}};
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
   const inner=z=>stairPlacement.width/2+.12+bankOffset(z),nx=23,nz=35;
   // The side order keeps the top normal upwards on both turned banks.
   closedSurface((i,j)=>{const z=.20+7.5*j/nz,u=(side>0?i:nx-i)/nx,x=side*(inner(z)+(4.6+.24*Math.sin(z*1.1))*u);return[x,bankY(x,z)-.10,z];},nx,nz,-.48,`scene03-closed-${side<0?'west':'east'}-planted-slope105`);
   for(let j=0;j<11;j++)for(let i=0;i<8;i++){
    const z=.35+j*.68+range(-.15,.15),x=side*(inner(z)+.12+i*.57+range(-.15,.15)),y=bankY(x,z),s=range(.75,1.35);
    emit(rocks[(j*8+i)%rocks.length],bankStone,[x,y-.16,z],[s*.64,s*.69,s*range(.60,.83)],[range(-.1,.1),range(0,6.28),range(-.08,.08)],range(.88,1.16));
    if(j>7&&i%3===0)gardenAssets.plant('rock',j*8+i,[x,y-.16,z],[s,.72,s*.92],[0,range(0,6.28),0],1.10);
   }
   // Irregular mixed patches replace the former identical hemispheres.
   for(let b=0;b<49;b++){
    const z=range(.45,7.28),x=side*(inner(z)+range(.28,4.05)),y=bankY(x,z)-.14,s=range(.62,1.02),v=b%4;if((x-pocket.x)**2+(z-pocket.z)**2<.68**2)continue;
    gardenAssets.plant('shrub',v,[x,y,z],[s*range(.82,1.22),s*range(.8,1.07),s],[range(-.07,.07),range(0,6.28),range(-.06,.06)],range(.88,1.16));plantedShrubs++;
    for(let k=0;k<4;k++){const xx=x+range(-.44,.44),zz=z+range(-.38,.38);if(Math.abs(xx)<inner(zz)+.10)continue;gardenAssets.plant('groundcover',b+k,[xx,bankY(xx,zz)-.14,zz],[range(1.2,2.2),range(1.1,1.9),range(1.2,2.2)],[range(-.05,.05),range(0,6.28),range(-.05,.05)],range(.94,1.16));}
    sprig(x,y,z,range(.53,.86),range(.58,1.02),b);
   }
   for(let i=0;i<10;i++){const z=.6+i*.65,x=side*(inner(z)+.28),y=bankY(x,z)-.08;gardenAssets.plant('groundcover',i,[x,y-.06,z],[2,1.7,2],[0,range(0,6.28),0],1.08);if(i%3===1)iris(x,y,z,range(.46,.72));}
  }
  const apronLength=routeEndZ+.55-7.65,pathCentre=z=>routeEndX*T.MathUtils.clamp((z-7.8)/routeLength,0,1),pathY=z=>stairPlacement.bottomWorldY+(routeEndY-stairPlacement.bottomWorldY)*T.MathUtils.clamp((z-7.8)/routeLength,0,1),
   apronY=(x,z)=>{const t=T.MathUtils.clamp((z-7.65)/apronLength,0,1),base=2.15*(1-t)**1.2*(.80+.20*Math.cos(x*.65)),ridge=pathY(z)*(1-T.MathUtils.smoothstep(Math.abs(x-pathCentre(z)),.55,1.05))*(1-T.MathUtils.smoothstep(z,routeEndZ,routeEndZ+.55));return Math.max(base,ridge)+.025*Math.sin(x*5+z*4);};
  closedSurface((i,j)=>{const z=7.65+apronLength*j/26,x=(-1+2*i/32)*(7.4-3.3*j/26)*(1+.014*Math.sin(z*2.7));return[x,apronY(x,z)-.06,z];},32,26,-.50,'scene03-closed-stair-to-bridge-rock-apron105');
  for(let j=0;j<9;j++)for(let k=0;k<11;k++){
   const z=7.78+j*(apronLength-.30)/8+range(-.07,.07),x=-4.35+k*.84+range(-.15,.15),y=apronY(x,z),r=range(.43,.76);if(Math.abs(x-pathCentre(z))<.71)continue;
   emit(rocks[(j+k)%rocks.length],bankStone,[x,y-.10,z],[r,r*range(.65,.95),r*range(.85,1.25)],[range(-.1,.1),range(0,6.28),range(-.1,.1)],range(.89,1.17));
   if((j+k)%3===0)gardenAssets.plant('groundcover',j+k,[x,y-.09,z],[1.6,1.5,1.6],[0,range(0,6.28),0],1.08);
   if((j+k)%5===0)sprig(x,y,z,.43,.54,j+k);
  }
  // A walkable supported stone approach joins the raised stair foot to
  // the fixed bridge landing. Adjacent planting sits below this ridge.
  const pathCount=Math.ceil(routeLength/.268);for(let j=0;j<pathCount;j++){const z=7.82+j*routeLength/pathCount,y=pathY(z);box([pathCentre(z),y+.014,z],[1.04,.15,routeLength/pathCount+.025],bankStone,[0,Math.atan2(routeEndX,routeLength)+range(-.025,.025),0]);}
  // Close the former square cutoff at the outer bank ends with a real
  // tapered earth shoulder, stone masses and roots evaluated on its top.
  for(const sign of[-1,1])for(let j=0;j<23;j++){
   const z=range(7.8,routeEndZ-.5),t=(z-7.65)/apronLength,outer=7.4-3.3*t,x=sign*range(Math.min(4.4,outer-.7),outer-.24),y=apronY(x,z),r=range(.42,.74);
   emit(rocks[j%rocks.length],bankStone,[x,y-.15,z],[r,r*.80,r*range(.85,1.15)],[0,range(0,6.28),0],range(.91,1.13));
   sprig(x,y-.08,z,range(.45,.72),range(.48,.77),j);
   gardenAssets.plant('groundcover',j,[x,y-.10,z],[1.9,1.6,1.9],[0,range(0,6.28),0],1.04);
  }
 })));
 // Independent closed mounds tie the right-bank lantern and iris roots to
 // the pond bed. They intersect the surrounding bank, not empty space.
 function mound(cx,cz,rx,rz,height,tag){
  const p=[],uv=[],N=64,R=15,shape=(t,a)=>[cx+Math.cos(a)*rx*t,-.11+height*(1-t*t)+.025*Math.sin(a*5)*Math.sin(Math.PI*t),cz+Math.sin(a)*rz*t],tri=(a,b,c)=>{for(const v of[a,b,c]){p.push(...v);uv.push(v[0],v[2]);}};
  for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2,t=j/R,u=(j+1)/R,A=shape(t,a),B=shape(t,b),C=shape(u,a),D=shape(u,b);tri(A,B,C);tri(B,D,C);}
  for(let i=0;i<N;i++){const a=shape(1,i/N*Math.PI*2),b=shape(1,(i+1)/N*Math.PI*2),aa=[a[0],-.55,a[2]],bb=[b[0],-.55,b[2]];tri(a,b,aa);tri(b,bb,aa);tri([cx,-.55,cz],aa,bb);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name=tag;emit(g,bankEarth);soilBodies.push(tag);
  return(x,z)=>-.11+height*Math.max(0,1-((x-cx)/rx)**2-((z-cz)/rz)**2);
 }
 const eastY=mound(7.0,6.9,3.05,3.4,1.05,'scene03-connected-foreground-toro-bank105');
 for(let k=0;k<22;k++){
  const a=k*2.39996,t=range(.42,.98),x=7+Math.cos(a)*3*t,z=6.9+Math.sin(a)*3.3*t,y=eastY(x,z),s=range(.48,.95);gardenAssets.plant('rock',k,[x,y-.20,z],[s,s*.8,s],[0,range(0,6.28),0],range(.95,1.12));
  if(k%2===0){gardenAssets.plant('shrub',k,[x,y-.07,z],[.7,.7,.7],[0,range(0,6.28),0],range(.88,1.08));sprig(x,y,z,.68,.89,k);}
  for(let j=0;j<3;j++)gardenAssets.plant('groundcover',k+j,[x+range(-.18,.18),y-.05,z+range(-.18,.18)],[1.8,1.6,1.8],[0,range(0,6.28),0],1.08);
 }
 const irisY=mound(1.25,7.80,.94,.91,1.13,'scene03-connected-bridge-iris-rock-pocket105');
 for(let k=0;k<11;k++){const a=k*2.39996,x=1.25+Math.cos(a)*range(.25,.88),z=7.80+Math.sin(a)*range(.25,.88),y=irisY(x,z),s=range(.38,.78);gardenAssets.plant('rock',k,[x,y-.19,z],[s,s*.95,s],[0,range(0,6.28),0],1.08);gardenAssets.plant('groundcover',k,[x,y-.01,z],[1.6,1.6,1.6],[0,range(0,6.28),0],1.1);}
 iris(1.18,irisY(1.18,7.82),7.82,1.26);iris(1.58,irisY(1.58,7.5),7.5,.75);
 // Footing rocks fit the two visible toro bases instead of merely placing
 // leaves around a shaft whose bottom had no bearing surface.
 gardenAssets.plant('rock',2,[6.25,.32,8.0],[2.0,.73,1.8],[0,.2,0],1.03);
 emit(rocks[3],bankStone,[4.216,1.77,4.369],[.72,.72,.72],[0,.35,0],1.06);
 return{info(){return{revision:'living-garden105-route106',closedSoilBodies:soilBodies,route:{bridgeWorld:bridgeEndWorld.toArray(),bridgeInStairFrame:bridgeEndLocal.toArray(),length:routeLength},rootedShrubs:plantedShrubs,rootedAzaleaSprigs:azaleaSprigs,rootedIrisFans:irises,scannedAssets:gardenAssets.info(),stairOpeningPreserved:true,photographicAccepted:false};}};
}
