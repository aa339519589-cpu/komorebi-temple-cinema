import * as T from 'three';

// One physical curve owns the visible narrow creek and its soil section.
// Near the camera it turns behind the right planting instead of filling
// the entire space beneath the foreground balustrade.
export function createGardenStream213(){
 const profile=[[-25,4.95],[-22,4.90],[-19,4.85],[-17,4.75],[-15,4.7],[-13,4.5],[-11,4.3],[-9,4.0],[-7,3.6],[-5,3.1],[-3,2.75],[-1,2.45],[0,2.15],[2,1.85],[3.4,2.25],[5,3.8],[7,6.3],[10,8.5]],curve=new T.CatmullRomCurve3(profile.map(([z,x])=>new T.Vector3(x,.52,z)),false,'centripetal'),samples=Array.from({length:101},(_,i)=>curve.getPoint(i/100));
 const halfWidth=t=>{const z=curve.getPoint(t).z;return(.42+.10*T.MathUtils.smoothstep(z,-7,-2)-.17*T.MathUtils.smoothstep(z,-1,3)+.07*T.MathUtils.smoothstep(z,4,8))*T.MathUtils.smoothstep(t,0,.07);};
 function xAt(z){if(z<=profile[0][0])return profile[0][1];if(z>=profile.at(-1)[0])return profile.at(-1)[1];for(let i=0;i+1<profile.length;i++)if(z>=profile[i][0]&&z<=profile[i+1][0])return T.MathUtils.lerp(profile[i][1],profile[i+1][1],(z-profile[i][0])/(profile[i+1][0]-profile[i][0]));}
 function closest(x,z){let best=Infinity,at=0,fx=0,fz=0,ex=1,ez=0;for(let i=0;i<100;i++){const a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,u=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/l2,0,1),d=(x-a.x-dx*u)**2+(z-a.z-dz*u)**2;if(d<best){best=d;at=(i+u)/100;fx=a.x+dx*u;fz=a.z+dz*u;const l=Math.sqrt(l2);ex=dz/l;ez=-dx/l;}}return{distance:Math.sqrt(best),t:at,east:x>=fx,foot:[fx,fz],eastNormal:[ex,ez]};}
 return{profile,curve,halfWidth,closest,xAt,info:{revision:'scene08-narrow-turned-creek213-r10',nearPoolRetired:true,waterPlaneY:.52,referencePixelsUsed:false,visualAccepted:false}};
}

function rootedBranch(points,radius){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal'),N=16,R=8,frames=curve.computeFrenetFrames(N,false),p=[],uv=[],ix=[];
 for(let j=0;j<=N;j++){const t=j/N,c=curve.getPoint(t),r=radius*(.12+.88*Math.pow(1-t,.9));for(let i=0;i<R;i++){const a=i/R*Math.PI*2,v=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);p.push(...v);uv.push(t*curve.getLength(),i/R);}}
 for(let j=0;j<N;j++)for(let i=0;i<R;i++){const a=j*R+i,b=j*R+(i+1)%R,c=a+R,d=b+R;ix.push(a,b,c,b,d,c);}const lo=p.length/3,hi=lo+1;p.push(...points[0],...points.at(-1));uv.push(0,0,1,0);for(let i=0;i<R;i++)ix.push(lo,(i+1)%R,i,hi,N*R+i,N*R+(i+1)%R);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name='scene08-213-closed-tapered-root-to-crown-branch';return{geometry:g,curve};
}

export function dressGardenDepth213({emit,between,scannedStones,botany,height}){
 const stream=createGardenStream213(),rocks=[],plants=[],branches=[],patches=[];
 const bank=(x,z,margin)=>{const q=stream.closest(x,z),w=stream.halfWidth(q.t);if(q.distance<w+margin){const sign=q.east?1:-1;return[q.foot[0]+sign*q.eastNormal[0]*(w+margin),q.foot[1]+sign*q.eastNormal[1]*(w+margin)];}return[x,z];};
 const groups=[[-.45,.75,[[0,0,1.50,1.30,3,1.40],[-.65,.48,.88,.58,0],[.66,-.40,.78,.56,1]]],[-1.75,1.55,[[0,0,1.22,.88,2],[.68,.48,.72,.48,5]]],[1.0,.8,[[0,0,.82,.54,5],[-.52,.55,.62,.34,0]]],[3.8,1.7,[[0,0,1.26,.92,3],[.70,-.55,.82,.55,4],[-.52,.63,.60,.35,0]]],[2.5,-7.3,[[0,0,.94,.66,2],[.63,.65,.68,.40,1]]],[5.6,-9.5,[[0,0,1.02,.76,3],[-.55,.63,.66,.42,1]]],[2.4,4.5,[[0,0,1.02,.56,0],[-.70,-.10,.64,.35,2]]]];
 for(const[cx,cz,components]of groups)for(const[dx,dz,width,limit,index,yaw=index*.71]of components){let[x,z]=bank(cx+dx,cz+dz,width*.24);const v=scannedStones.info.variants[index%scannedStones.info.variants.length],h=Math.min(width*v.height/v.width,limit),soil=height(x,z),base=soil-h*.22;scannedStones.place({emit,x,z,height:base,width,heightLimit:limit,index,allowTall:true,yaw});rocks.push({x,z,width,height:h,base,soil,index,yaw});}
 function clump(x,z,h,span,kind,yaw,foreground=false){[x,z]=bank(x,z,.30);const y=height(x,z),roots=foreground?2:3,forks=foreground?3:4,record={x,y,z,h,span,kind,foreground,branches:0},trunks=[];
  for(let j=0;j<roots;j++){const a=yaw+(j-(roots-1)/2)*.78,tip=[x+Math.cos(a)*span*.60,y+h*.85,z+Math.sin(a)*span*.60],trunk=rootedBranch([[x+(j-.7)*.028,y-.055,z],[x+Math.cos(a)*span*.08,y+h*.28,z+Math.sin(a)*span*.06],[x+Math.cos(a)*span*.34,y+h*.67,z+Math.sin(a)*span*.30],tip],foreground?.021:.018);emit(trunk.geometry,'bark');trunks.push(trunk.curve);record.branches++;
   for(let k=0;k<forks;k++){const start=trunk.curve.getPoint(.44+k*.14),b=a+(k-(forks-1)/2)*.69,end=[x+Math.cos(b)*span*(.74+.10*Math.sin(j*2.1+k)),y+h*(.67+.15*Math.cos(k*.9+j)),z+Math.sin(b)*span*(.74+.10*Math.sin(j*2.1+k))],mid=start.clone().lerp(new T.Vector3(...end),.55);mid.y+=h*.12;const fork=rootedBranch([start.toArray(),mid.toArray(),end],foreground?.008:.0065);emit(fork.geometry,'bark');record.branches++;
    for(const t of[.55,.91]){const c=fork.curve.getPoint(t),d=b+(t===.55?-.65:.58),reach=span*.24,leafEnd=[c.x+Math.cos(d)*reach,c.y+h*.06,c.z+Math.sin(d)*reach];botany.foliage({emit,between,start:c.toArray(),end:leafEnd,kind,leafLength:foreground?.102:kind==='maple'?.082:.083,nodes:foreground?6:7});}
   }
  }
  if(foreground)for(let j=0;j<2;j++)for(let k=0;k<4;k++){const a=yaw+(k-1.5)*.68+j*.30,start=trunks[j].getPoint(.18+k*.075).toArray(),end=[x+Math.cos(a)*span*(.65+.10*k),y+h*(.27+.065*k),z+Math.sin(a)*span*(.65+.10*k)],mid=start.map((v,i)=>(v+end[i])*.5);mid[1]+=.10;const lower=rootedBranch([start,mid,end],.009);emit(lower.geometry,'bark');record.branches++;for(const t of[.45,.82]){const c=lower.curve.getPoint(t),q=a+(t===.45?-.60:.58),tip=[c.x+Math.cos(q)*span*.20,c.y+.055,c.z+Math.sin(q)*span*.20];botany.foliage({emit,between,start:c.toArray(),end:tip,kind,leafLength:.102,nodes:6});}}
  branches.push(record);
 }
 clump(-1.55,9.45,1.12,1.20,'framing',.35,true);
 clump(-3.0,-.15,1.28,1.23,'leaflight',.30);
 clump(-1.25,-2.7,.92,1.02,'leaf',2.40);
 clump(.62,.85,.68,.73,'leaflight',2.3);
 clump(4.45,2.7,1.35,1.42,'maple',3.25);
 clump(2.85,-8.2,.83,.95,'leaf',.45);
 clump(5.40,-9.7,.90,1.04,'leaflight',2.15);
 clump(3.05,2.25,.40,.58,'leaflight',2.70);
 let seed=213101;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(const[cx,cz,rx,rz,count]of[[.65,-3.0,.95,1.35,26],[2.85,2.0,.62,1.2,22],[-1.05,.0,1.3,1.6,30],[2.6,-7.7,1.2,1.8,22],[.45,3.3,1.35,1.25,30],[4.65,1.25,1.25,2.0,34],[.2,6.25,1.60,1.10,28],[.10,-1.8,1.15,1.3,24],[-.05,7.4,1.35,.80,24]]){let planted=0;for(let i=0;i<count;i++){const a=i*2.399963,r=.96*Math.sqrt(R());let[x,z]=bank(cx+Math.cos(a)*rx*r,cz+Math.sin(a)*rz*r,.30);const width=.38+.30*R();if(rocks.some(b=>((x-b.x)/(b.width*.38))**2+((z-b.z)/(b.width*.38))**2<1))continue;const flower=i%11===2,placed=botany.groundMat({emit,between,height,x,z,width,index:i});let blossom=null;if(flower)blossom=botany.place({emit,height,x,z,width:.16,flower:true,index:i,yaw:a,heightLimit:.18});plants.push({x,y:height(x,z),z,requestedWidth:width,flower,actual:placed,blossom});planted++;}patches.push({centre:[cx,cz],planted});}
 let edgeRoots=0;
 for(let i=0;i<24;i++){const z=-5.1+i*.30;let lo=0,hi=1;for(let k=0;k<18;k++){const mid=(lo+hi)/2;if(stream.curve.getPoint(mid).z<z)lo=mid;else hi=mid;}const t=(lo+hi)/2,c=stream.curve.getPoint(t),tan=stream.curve.getTangent(t).normalize(),east=new T.Vector3(tan.z,0,-tan.x).normalize(),w=stream.halfWidth(t);for(const [side,row]of[[-1,0],...(i%3===0?[[-1,1]]:[]),...(i%2===0?[[1,0]]:[])]){const offset=w+.34+row*.38+.08*Math.sin(i*2.7),x=c.x+east.x*side*offset,zz=c.z+east.z*side*offset,width=.40+.10*(.5+.5*Math.sin(i*1.9+row));if(rocks.some(b=>((x-b.x)/(b.width*.35))**2+((zz-b.z)/(b.width*.35))**2<1))continue;const actual=botany.groundMat({emit,between,height,x,z:zz,width,index:300+i*3+row});plants.push({x,y:height(x,zz),z:zz,requestedWidth:width,waterEdgeRunner:true,actual});edgeRoots++;}}
 patches.push({type:'actual-creek-contour-runners',planted:edgeRoots});
 return{revision:'scene08-contour-creeping-bank213-r14',rocks,branches,plants,patches,rootedOnActualTerrain:true,originalScanBladesAndWholePlants:true,referencePixelsUsed:false,visualAccepted:false};
}
