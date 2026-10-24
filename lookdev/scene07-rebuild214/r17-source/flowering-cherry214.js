import * as T from 'three';
import {installLeafScattering214} from './world-radiance214.js';

// Authored full-volume flowering cherry: closed bearing wood, attached fine
// twigs and separate cupped five-petal flowers. No canopy envelope, sphere
// scatter, photograph, alpha card or runtime camera input is used.
const TAU=Math.PI*2,UP=new T.Vector3(0,1,0),V=a=>new T.Vector3(...a);
const random=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
export function buildFloweringCherry214({emit,mats,height:h,spread,seed}){
 const R=random(seed),rr=(a,b)=>a+(b-a)*R(),wood=[],woodColors=[],woodIndices=[],petals=[],petalColors=[],leaves=[],leafColors=[];
 let branches=0,flowerCount=0,leafCount=0,spurs=0;
 function tube(points,r0,r1,sides=7){
  const curve=new T.CatmullRomCurve3(points.map(V)),length=curve.getLength(),N=Math.max(3,Math.ceil(length*5)),frames=curve.computeFrenetFrames(N,false),first=wood.length/3;
  for(let j=0;j<=N;j++){
   const t=j/N,c=curve.getPointAt(t),r=r1+(r0-r1)*Math.pow(1-t,1.12);
   for(let k=0;k<sides;k++){
    const a=k*TAU/sides,relief=1+.045*Math.sin(a*5+t*31+seed),p=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r*relief).addScaledVector(frames.binormals[j],Math.sin(a)*r*relief),tone=.77+.14*Math.sin(a*3+t*13)+.09*R();
    wood.push(...p.toArray());woodColors.push(tone,tone*.96,tone*.91);
   }
  }
  for(let j=0;j<N;j++)for(let k=0;k<sides;k++){const n=(k+1)%sides,a=first+j*sides+k,b=first+j*sides+n,c=a+sides,d=b+sides;woodIndices.push(a,b,c,b,d,c);}
  for(const end of[0,N]){const c=curve.getPointAt(end/N),centre=wood.length/3;wood.push(...c.toArray());woodColors.push(.82,.78,.72);for(let k=0;k<sides;k++){const a=first+end*sides+k,b=first+end*sides+(k+1)%sides;woodIndices.push(centre,...(end?[a,b]:[b,a]));}}
  branches++;return curve;
 }
 const triangle=(out,colors,a,b,c,color)=>{out.push(...a.toArray(),...b.toArray(),...c.toArray());for(let k=0;k<3;k++)colors.push(...color);};
 function flower(p,n,size){
  n.normalize();let u=new T.Vector3(1,0,0).cross(n);if(u.lengthSq()<.01)u=new T.Vector3(0,0,1).cross(n);u.normalize();const v=n.clone().cross(u),phase=rr(0,TAU),ivory=R()<.18,tone=rr(.89,1.08),color=ivory?[tone,tone*.94,tone*.87]:[tone,tone*rr(.69,.83),tone*rr(.77,.91)];
  for(let j=0;j<5;j++){
   const a=phase+j*TAU/5,axis=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a)),side=n.clone().cross(axis),s=size*rr(.91,1.09),centre=p.clone().addScaledVector(axis,s*.51).addScaledVector(n,s*.10),outline=[[.10,0],[.44,-.31],[.88,-.32],[1.0,-.09],[.955,.055],[1.0,.19],[.72,.36],[.34,.27]].map(([x,y])=>p.clone().addScaledVector(axis,s*x).addScaledVector(side,s*y).addScaledVector(n,s*(.05+.16*Math.sin(x*Math.PI))));
   for(let k=0;k<outline.length;k++)triangle(petals,petalColors,centre,outline[k],outline[(k+1)%outline.length],color);
  }
  flowerCount++;
 }
 function leaf(p,d,size){
  d.normalize();const side=V([-d.z,.06,d.x]).normalize(),tip=p.clone().addScaledVector(d,size),middle=p.clone().lerp(tip,.48).addScaledVector(UP,size*.12),l=p.clone().lerp(tip,.49).addScaledVector(side,size*.21),r=p.clone().lerp(tip,.49).addScaledVector(side,-size*.21),tone=rr(.78,1.06),c=[tone*.80,tone,tone*.64];
  for(const a of[[p,l,middle],[l,tip,middle],[middle,tip,r],[p,middle,r]])triangle(leaves,leafColors,...a,c);leafCount++;
 }
 const trunk=tube([[0,-.025,0],[-.10,h*.18,.07],[.15,h*.37,.02],[.05,h*.55,.10],[.17,h*.70,.13]],h*.027,h*.006,11);
 const fork=tube([[.02,h*.31,.04],[-.23,h*.44,.10],[-.58,h*.56,.17],[-.73,h*.69,.24]],h*.016,h*.0035,9);
 for(let b=0;b<13;b++){
  const a=b*2.399963+rr(-.18,.18),parent=b%4===0?fork:trunk,root=parent.getPoint(.46+(b%5)*.085),reach=spread*rr(.63,1.14),rise=h*rr(.08,.25),end=root.clone().add(V([Math.cos(a)*reach,rise,Math.sin(a)*reach*.86])),elbow=root.clone().lerp(end,.58).add(V([rr(-.15,.15),-h*.025,rr(-.12,.12)])),axis=tube([root.toArray(),elbow.toArray(),end.toArray()],h*rr(.006,.010),.006,8);
  for(let sideBranch=0;sideBranch<9;sideBranch++){
   const t=.24+sideBranch*.70/8,joint=axis.getPoint(t),heading=a+(sideBranch%2?1:-1)*rr(.57,1.05),reach2=spread*rr(.23,.44)*(1-.24*t),tip=joint.clone().add(V([Math.cos(heading)*reach2,h*rr(.005,.10),Math.sin(heading)*reach2])),mid=joint.clone().lerp(tip,.52).add(V([0,-.035,0])),twig=tube([joint.toArray(),mid.toArray(),tip.toArray()],rr(.009,.015),.0028,6);
   for(let spur=0;spur<8;spur++){
    const st=.18+spur*.74/7,p=twig.getPoint(st),heading2=heading+(spur%2?1:-1)*rr(.66,1.14),length=rr(.14,.27),dir=V([Math.cos(heading2)*.67,rr(.32,.86),Math.sin(heading2)*.67]).normalize(),finish=p.clone().addScaledVector(dir,length),bend=p.clone().lerp(finish,.52).add(V([0,.015,0])),shoot=tube([p.toArray(),bend.toArray(),finish.toArray()],.0025,.0008,5);
    // Cherry flowers form short umbels at shared buds. The rejected R16
    // evenly spaced single blooms read as long flowering racemes.
    for(let bud=0;bud<5;bud++)for(let bloom=0;bloom<4;bloom++){
     const at=.18+bud*.17,attachment=shoot.getPoint(at),az=bloom*TAU/4+bud*2.399963+rr(-.33,.33),normal=V([Math.cos(az)*rr(.50,1.0),rr(.12,.95),Math.sin(az)*rr(.50,1.0)]).normalize(),pedicel=rr(.028,.062),centre=attachment.clone().addScaledVector(normal,pedicel);
     tube([attachment.toArray(),centre.toArray()],.00065,.00035,4);flower(centre,normal,rr(.023,.034));
    }
    if((spur+sideBranch+b)%9===0)leaf(finish,dir.clone().add(V([rr(-.3,.3),.22,rr(-.3,.3)])),rr(.07,.11));spurs++;
   }
  }
 }
 const geometry=(p,c,ix=null)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));if(ix)g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();return g;},woodG=geometry(wood,woodColors,woodIndices),flowerG=geometry(petals,petalColors),leafG=geometry(leaves,leafColors),bark=new T.MeshStandardMaterial({name:'scene07-connected-flowering-cherry-bark214',color:0x685047,roughness:.97,vertexColors:true}),flowerM=new T.MeshStandardMaterial({name:'scene07-attached-cupped-cherry-corollas214',color:0xffe5e6,roughness:.89,side:T.DoubleSide,vertexColors:true}),leafM=new T.MeshStandardMaterial({name:'scene07-cherry-small-live-leaves214',color:0x63793d,roughness:.91,side:T.DoubleSide,vertexColors:true});
 installLeafScattering214(flowerM,{strength:.20,power:1.3,indirectTransmission:.28});installLeafScattering214(leafM,{strength:.28,power:1.4,indirectTransmission:.40});
 // The legacy garden parent scales depth by .6. Undo it for each biological
 // mesh so wood, petals and pedicels retain isotropic physical dimensions.
 for(const[g,m]of[[woodG,bark],[flowerG,flowerM],[leafG,leafM]])emit(g,m,0,0,0,1,1,1/.6);
 return{revision:'scene07-receding-cherry-crown-and-bud-umbels214-r17',seed,height:h,spread,branches,spurs,flowerCount,leafCount,flowerDiameterMetres:[.046,.068],flowersPerBud:4,budsPerSpur:5,woodBounds:woodG.boundingBox,flowerBounds:flowerG.boundingBox,triangles:woodIndices.length/3+petals.length/9+leaves.length/9,cameraInput:false,canopyCards:false,photographPixels:false,visualAccepted:false};
}
