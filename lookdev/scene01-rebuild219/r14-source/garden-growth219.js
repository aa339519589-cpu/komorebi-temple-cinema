import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TAU,V,rng,noise} from './kernel.js';

// Rooted azalea and low bank plants: nodes carry shoots, petioles, actual
// cupped leaf blades and funnel corollas. No billboard foliage or photo map.
export function buildFloweringBanks219(B,{site,clearance}){
 const random=rng(219331),rr=(a,b)=>a+(b-a)*random(),branches=[];
 const leaf=(()=>{const p=[],uv=[],ix=[],R=10;for(let j=0;j<=R;j++){const t=j/R,w=.23*Math.sin(t*Math.PI)**.72;for(let k=0;k<5;k++){const u=-1+k*.5;p.push(u*w,.04*Math.sin(t*Math.PI)*(1-u*u)+.023*Math.sin(t*5)*u*u,(t-.12)*.90);uv.push(k/4,t);if(k<4&&j<R){const a=j*5+k;ix.push(a,a+5,a+1,a+1,a+5,a+6);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();B.resources.add(g);return g;})();
 const blossom=(()=>{const p=[],uv=[],ix=[],N=50,R=6;for(let j=0;j<=R;j++){const t=j/R;for(let k=0;k<=N;k++){const a=k/N*TAU,lobe=.73+.27*Math.cos(a*5),r=(.14+.86*t)*(.42+.58*t)*lobe,y=.18+.32*t-.22*t**4;p.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(.5+Math.cos(a)*t*.5,.5+Math.sin(a)*t*.5);if(k<N&&j<R){const q=j*(N+1)+k;ix.push(q,q+N+1,q+1,q+1,q+N+1,q+N+2);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();B.resources.add(g);return g;})();
 const pink=B.m.pink.clone();pink.name='garden219-azalea-magenta-corolla';pink.color.setHex(0xc36182);pink.roughness=.80;pink.side=T.DoubleSide;
 pink.onBeforeCompile=B.m.leaf.onBeforeCompile;pink.customProgramCacheKey=()=> 'garden219-thin-transmitting-azalea-corolla';
 const pale=B.m.pinkLight.clone();pale.name='garden219-soft-pink-corolla';pale.color.setHex(0xe7a0ae);pale.roughness=.80;pale.side=T.DoubleSide;pale.onBeforeCompile=B.m.leaf.onBeforeCompile;pale.customProgramCacheKey=pink.customProgramCacheKey;Object.assign(B.m,{garden219Pink:pink,garden219Pale:pale});
 function limb(points,r,tip=.22){const curve=new T.CatmullRomCurve3(points.map(V)),g=new T.TubeGeometry(curve,12,r,6,false),p=g.attributes.position;for(let j=0;j<=12;j++){const c=curve.getPointAt(j/12);for(let k=0;k<=6;k++){const i=j*7+k,v=new T.Vector3().fromBufferAttribute(p,i).sub(c).multiplyScalar(1-(1-tip)*j/12).add(c);p.setXYZ(i,v.x,v.y,v.z);}}g.computeVertexNormals();branches.push(g);return curve;}
 let plants=0,leaves=0,flowers=0;
 for(const [x,z,r,h,flowered]of[[4.55,-.82,1.45,2.50,true],[6.40,-1.20,1.32,2.15,true],[7.50,1.38,1.30,1.90,true],[6.40,4.35,.85,1.06,true],[4.88,4.80,.70,.63,false],[-.53,-2.15,1.0,1.06,true],[-7.55,1.8,1.05,1.18,true],[-5.9,3.7,.80,.73,false]]){
  if(clearance(x,z,r*.55))continue;const y=site(x,z).height+.025;plants++;
  B.label('garden219-rooted-branching-azalea-and-bank-underplanting',()=>{
   for(let arm=0;arm<7;arm++){
    const a=arm*2.39996+rr(-.18,.18),reach=r*rr(.60,.99),tip=[x+Math.cos(a)*reach,y+h*rr(.64,.94),z+Math.sin(a)*reach*.73],stem=limb([[x+rr(-.06,.06),y-.02,z+rr(-.06,.06)],[x+Math.cos(a)*reach*.38,y+h*.67,z+Math.sin(a)*reach*.23],tip],r*.024);
    for(let twig=0;twig<5;twig++){
     const t=.35+twig*.145,node=stem.getPoint(t),ang=a+(twig%2?-1:1)*rr(.55,1.25),len=r*rr(.31,.55),end=[node.x+Math.cos(ang)*len,node.y+rr(.03,.22)*h,node.z+Math.sin(ang)*len*.72],shoot=limb([node.toArray(),[(node.x+end[0])*.5,node.y+h*.18,(node.z+end[2])*.5],end],.012, .16);
     for(let n=1;n<=12;n++){
      const q=shoot.getPoint(n/12);for(const side of[-1,1])for(const fan of[-1,0,1]){
       const yaw=ang+side*rr(.65,1.15)+fan*.34,sz=rr(.085,.135)*Math.min(1.3,r),length=sz*.92,root=q.clone().add(V([Math.sin(yaw)*length*(.2+Math.abs(fan)*.5),.007+fan*.012,Math.cos(yaw)*length*(.2+Math.abs(fan)*.5)]));
       B.between(q.toArray(),root.toArray(),.0028,.0028,'bark',true);B.emit(leaf,n%3?'leafDark':'leaf',root.x,root.y,root.z,sz,sz,sz,[rr(-.33,.18),yaw,side*rr(.06,.40)],rr(.80,1.16));leaves++;
      }
     }
     if(flowered&&twig>0)for(let f=0;f<7;f++){
      const a=f*2.39996,reach=rr(.03,.13),xx=end[0]+Math.cos(a)*reach,zz=end[2]+Math.sin(a)*reach,yy=end[1]+rr(-.03,.09),s=rr(.033,.052),tilt=rr(-.50,.50);
      B.between(end,[xx,yy,zz],.002,.002,'leafDark',true);B.emit(blossom,(arm+f)%4?'garden219Pink':'garden219Pale',xx,yy,zz,s,s,s,[tilt,a,rr(-.4,.4)],rr(.80,1.15));
      for(let st=0;st<3;st++){const u=a+st*TAU/3;B.between([xx,yy+.012,zz],[xx+Math.cos(u)*s*.33,yy+s*.65,zz+Math.sin(u)*s*.33],.001,.001,'flowerCream',true);}flowers++;
     }
    }
   }
  });
 }
 // Fernlets and sedges fill crevices, but leave the waterfall and access
 // route clear. Individual fronds arch and decline instead of a flat disk.
 B.label('garden219-rooted-crevice-fronds',()=>{for(let k=0;k<210;k++){
  const right=k%3!==0,x=right?rr(3.2,7.9):rr(-7.8,-4.8),z=rr(.4,6.8);if(clearance(x,z,.18))continue;const y=site(x,z).height+.018,s=rr(.14,.28);
  for(let f=0;f<5;f++){const a=f*TAU/5+rr(-.3,.3);for(let n=1;n<=6;n++){const t=n/7,xx=x+Math.cos(a)*s*t,zz=z+Math.sin(a)*s*t,yy=y+Math.sin(t*Math.PI*.9)*s*.65;for(const side of[-1,1])B.emit(leaf,n%3?'leaf':'leafLight',xx,yy,zz,s*.30*(1-t*.62),s*.4,s*.42,[.1,a+side*.70,side*.16],rr(.72,1.12));}}
 }});
 if(branches.length){const g=mergeGeometries(branches);g.name='garden219-continuous-rooted-azalea-branch-solids';B.label('garden219-visible-woody-stems-and-shoots',()=>B.emit(g,'bark'));for(const b of branches)b.dispose();}
 return{revision:219,rootedPlants:plants,twigCarriedLeaves:leaves,funnelFlowers:flowers,placementSeed:219331,imageAssets:false};
}
