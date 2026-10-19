from pathlib import Path
p=Path('reconstructions/scene-07/src/reference-layout118.js');s=p.read_text()
s=s.replace('group,mats}=api','group,mats,graniteMaps}=api')
s=s.replace("const b=(p,d,m=timber,yaw=0)=>emit(new RoundedBoxGeometry(...d,2,Math.min(.018,...d.map(x=>x*.12))),m,...p,1,1,1,[0,yaw,0]);", """const b=(p,d,m=timber,yaw=0)=>{const g=new RoundedBoxGeometry(...d,2,Math.min(.012,...d.map(x=>x*.1)));if(m.userData.metricGranite){const a=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(a.count*2);for(let i=0;i<a.count;i++){const ax=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],k=ax.indexOf(Math.max(...ax));uv[i*2]=((k===0?a.getZ(i):a.getX(i))+p[0])/.317;uv[i*2+1]=((k===1?a.getZ(i):a.getY(i))+p[2])/.317;}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}emit(g,m,...p,1,1,1,[0,yaw,0]);};""")
s=s.replace("const cross=(t,side=0)=>{const p=curve.getPoint(t),d=curve.getTangent(t)","const deckPoint=t=>{const p=curve.getPoint(t);if(t>=.75)p.y=4.5;return p;};\n const cross=(t,side=0)=>{const p=deckPoint(t),d=curve.getTangent(t)")
s=s.replace("const stone=mats.stone.clone();stone.name='layout118-bridge-granite';stone.color.setHex(0x8b8c80);", """const stone=new T.MeshStandardMaterial({name:'layout118-metric-worn-granite',color:0xa5a198,roughness:.9,map:graniteMaps.map,normalMap:graniteMaps.normalMap,roughnessMap:graniteMaps.roughnessMap});stone.normalScale.set(.22,.22);stone.userData.metricGranite=true;
 stone.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 g=texture2D(map,vMapUv).rgb;float mineral=dot(g,vec3(.2126,.7152,.0722));diffuseColor.rgb*=clamp(pow(max(mineral,.0001)/.153180782734,.65),.66,1.42);
 #endif`);};stone.customProgramCacheKey=()=> 'layout118-metric-neutral-granite';""")
s=s.replace('const band=(side,y0,y1,width,material)=>{','const band=(side,y0,y1,width,material,end=1)=>{').replace('const t=i/N,c=cross(t,side)','const t=end*i/N,c=cross(t,side)')
s=s.replace('p=curve.getPoint(t),d=curve.getTangent(t),yaw','p=deckPoint(t),d=curve.getTangent(t),yaw')
s=s.replace("for(const y of[.24,.64,1.06])band(side,y-.06,y+.06,y>1?.18:.12,timber);","for(const y of[.24,.64,1.06])band(side,y-.06,y+.06,y>1?.18:.12,timber,side<0?.73:1);")
s=s.replace('for(let i=0;i<=8;i++){\n   const p=cross', 'for(let i=0;i<=(side<0?5:8);i++){\n   const p=cross')
s=s.replace('const steps=11;','const steps=13;')
start=s.index(' // Closed landing at the foot of the main stair')
end=s.index(' const audit={revision:',start)
s=s[:start]+''' // A connected stair/landing/bridge graph. Every datum is shared by the
 // adjacent pieces, rather than placing independent solid boxes by eye.
 const hall=new T.Matrix4().makeTranslation(4.6,0,-9).multiply(new T.Matrix4().makeRotationY(-.25));
 const hp=(x,y,z)=>V([x,y,z]).applyMatrix4(hall);
 const flightTop=6.60,flightBottom=5.0,flightCount=10,runStart=5.15,tread=.32,stairWidth=5.8;
 const stepSolids=[];
 for(let i=0;i<flightCount;i++){
  const y=flightTop-(i+1)*(flightTop-flightBottom)/flightCount,z=runStart+(i+.5)*tread;
  // Four independently jointed granite slabs form each tread. Full-height
  // riser faces are supported by masonry, with no huge smooth gray frontage.
  for(let j=0;j<4;j++){const q=hp(-stairWidth/2+(j+.5)*stairWidth/4,y-.085,z);b(q.toArray(),[stairWidth/4-.012,.17,tread+.018],stone,-.25);stepSolids.push({centre:q.toArray(),top:y});}
  for(const side of[-1,1]){const q=hp(side*(stairWidth/2+.10),y-.20,z);b(q.toArray(),[.22,.40,tread+.016],stone,-.25);}
  // Solid coursed backing rises directly below its own tread.
  const bottom=4.82;
  for(let yy=bottom+.10;yy<y-.17;yy+=.20)for(let j=0;j<8;j++){const q=hp(-stairWidth/2+(j+.5)*stairWidth/8,yy,z);b(q.toArray(),[stairWidth/8-.012,.192,tread+.014],stone,-.25);}
 }
 function slabQuad(corners,thickness=.25){const pos=[],ix=[];for(const h of[0,-thickness])for(const q of corners)pos.push(q.x,q.y+h,q.z);ix.push(0,2,1,0,3,2,4,5,6,4,6,7);for(let i=0;i<4;i++){const j=(i+1)%4;ix.push(i,j,i+4,j,j+4,i+4);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(pos.flatMap((q,i)=>i%3===0?[q/.317,pos[i+2]/.317]:[]),2));g.setIndex(ix);g.computeVertexNormals();emit(g,stone,0,0,0);}
 const joinLeft=cross(.76,-1),joinRight=cross(.99,-1),forward=new T.Vector3(-Math.sin(.25),0,Math.cos(.25)),joinBackLeft=joinLeft.clone().addScaledVector(forward,-.96).setY(5),joinBackRight=joinRight.clone().addScaledVector(forward,-.96).setY(5);
 const stairBottomLeft=hp(-stairWidth/2,5,runStart+flightCount*tread+.01),stairBottomRight=hp(stairWidth/2,5,runStart+flightCount*tread+.01);
 slabQuad([stairBottomLeft,stairBottomRight,joinBackRight,joinBackLeft]);
 for(let i=0;i<3;i++){const t0=i/3,t1=(i+1)/3,y=5-(i+1)/6,a=joinBackLeft.clone().lerp(joinLeft,t0).setY(y),bq=joinBackRight.clone().lerp(joinRight,t0).setY(y),c=joinBackRight.clone().lerp(joinRight,t1).setY(y),d=joinBackLeft.clone().lerp(joinLeft,t1).setY(y);slabQuad([a,bq,c,d],.17);}
 // Open stony piers support the landing; their feet are not suspended.
 for(const q of[stairBottomLeft,stairBottomRight,joinBackLeft,joinBackRight])for(let y=.13;y<4.74;y+=.26)b([q.x,y,q.z],[.56,.25,.56],stone,-.25);
 function slopeBeam(a,bp,h,width=.14){const p=a.clone().add(new T.Vector3(0,h,0)),q=bp.clone().add(new T.Vector3(0,h,0)),direction=q.clone().sub(p),mid=p.clone().add(q).multiplyScalar(.5),g=new RoundedBoxGeometry(direction.length(),width,width,2,.012),quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),direction.normalize()),e=new T.Euler().setFromQuaternion(quat);emit(g,timber,...mid.toArray(),1,1,1,[e.x,e.y,e.z]);}
 for(const side of[-1,1]){const a=hp(side*3.02,flightTop,runStart),end=hp(side*3.02,flightBottom,runStart+flightCount*tread);for(let i=0;i<=5;i++){const p=a.clone().lerp(end,i/5);b([p.x,p.y+.52,p.z],[.20,1.04,.20],timber,-.25);}for(const h of[.24,.66,1.03])slopeBeam(a,end,h);}
 const connectionAudit={stairRisers:flightCount,riseMetres:.16,treadMetres:.32,slabsPerTread:4,mainLandingY:5,bridgeJoinY:4.5,connectorRisers:3,connectorRiseMetres:1/6,bridgeBackRailOpening:[.73,1],stairTreadSlabs:stepSolids.length,landingSupports:'Coursed stone piers to worldY0',unmeasuredDepths:true};
''' + s[end:]
s=s.replace("const audit={revision:'layout118',", "const audit={revision:'layout118',connections:connectionAudit,")
p.write_text(s)
