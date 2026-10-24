import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Three compact, independently authored living shrub variants. Real curved
// small leaves grow around a woody branch hierarchy; no whole-plant cards.
export function createEvergreenShrubKit212(){
 const bark=new T.MeshStandardMaterial({name:'scene04-212-shrub-branched-wood',color:'#51412b',roughness:1,vertexColors:true}),leafMaterial=new T.MeshStandardMaterial({name:'scene04-212-small-evergreen-leaf',color:'#63833d',roughness:.88,vertexColors:true,side:T.DoubleSide}),variants=[];
 const baseLeaf=new T.PlaneGeometry(1,1,2,5),p=baseLeaf.attributes.position;
 for(let i=0;i<p.count;i++){const t=.5-p.getY(i),u=p.getX(i)*2;p.setXYZ(i,u*.30*Math.sin(Math.PI*t),.055*Math.sin(Math.PI*t)*(1-u*u),.5-t);}baseLeaf.computeVertexNormals();
 for(let variant=0;variant<3;variant++){
  let seed=91283+variant*719;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),rr=(a,b)=>a+(b-a)*rand(),wood=[],leaves=[],object=new T.Object3D();
  const branch=(points,r)=>{const g=new T.TubeGeometry(new T.CatmullRomCurve3(points),14,r,6,false);g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));wood.push(g);};
  branch([new T.Vector3(0,0,0),new T.Vector3(.018,.26,-.012),new T.Vector3(-.02,.58,.01)],.025);
  for(let b=0;b<9;b++){
   const az=b*2.399+variant*.53,reach=.21+rr(0,.16),root=new T.Vector3(0,.18+b*.028,0),crown=new T.Vector3(Math.cos(az)*reach,.49+rr(0,.30),Math.sin(az)*reach),middle=root.clone().lerp(crown,.55);middle.y+=.04;branch([root,middle,crown],.009+rr(0,.006));
   for(let twig=0;twig<12;twig++){
    const a=az+twig*2.399,r=rr(.07,.20),tip=crown.clone().add(new T.Vector3(Math.cos(a)*r,rr(-.05,.12),Math.sin(a)*r)),start=middle.clone().lerp(crown,.60);branch([start,crown.clone().lerp(tip,.52),tip],.0025);
    for(let k=0;k<16;k++){
     const a1=k*2.399+rr(-.4,.4),radius=rr(.018,.10),location=tip.clone().add(new T.Vector3(Math.cos(a1)*radius,rr(-.045,.055),Math.sin(a1)*radius)),g=baseLeaf.clone();object.position.copy(location);object.rotation.set(rr(-.70,.70),a1,rr(-.65,.65));const len=rr(.045,.082);object.scale.set(len,len,len);object.updateMatrix();g.applyMatrix4(object.matrix);
     const tone=rr(.62,1.12),colors=[];for(let j=0;j<g.attributes.position.count;j++)colors.push(tone*.93,tone,tone*.78);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));leaves.push(g);
    }
   }
  }
  const wg=mergeGeometries(wood,false),lg=mergeGeometries(leaves,false),geometry=mergeGeometries([wg,lg],true);for(const g of[...wood,...leaves,wg,lg])g.dispose();geometry.computeBoundingBox();geometry.computeBoundingSphere();const box=geometry.boundingBox,size=box.getSize(new T.Vector3());variants.push({name:'authored-evergreen212-'+variant,geometry,material:[bark,leafMaterial],height:size.y,radius:Math.hypot(size.x,size.z)/2});
 }
 baseLeaf.dispose();return{id:'evergreen212',source:'Independent authored branching evergreen, not a measured species/scan',license:'Original project-authored geometry',variants};
}

export function createFernKit212(){
 const stem=new T.MeshStandardMaterial({name:'scene04-212-fern-living-rachis',color:'#4b622a',roughness:.96,vertexColors:true}),leaf=new T.MeshStandardMaterial({name:'scene04-212-curved-fern-pinnae',color:'#4b6a2b',roughness:.84,vertexColors:true,side:T.DoubleSide}),variants=[];
 for(let variant=0;variant<3;variant++){
  let seed=48291+variant*731;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),wood=[],leaves=[];
  for(let f=0;f<7+variant*2;f++){
   const a=f*2.399+variant*.41,reach=.31+.16*random(),curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(Math.cos(a)*reach*.43,.38+.12*random(),Math.sin(a)*reach*.43),new T.Vector3(Math.cos(a)*reach,.13+.08*random(),Math.sin(a)*reach)]),stalk=new T.TubeGeometry(curve,24,.0034,5,false);stalk.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(stalk.attributes.position.count*3).fill(1),3));wood.push(stalk);
   for(let k=1;k<19;k++)for(const side of[-1,1]){
    const t=k/20,root=curve.getPoint(t),aa=a+side*(1.15-.22*t),dir=new T.Vector3(Math.cos(aa),0,Math.sin(aa)),cross=new T.Vector3(-dir.z,0,dir.x),length=(.025+.12*Math.pow(Math.sin(Math.PI*t),.8))*(.90+.2*random()),p=[],uv=[],colors=[],ix=[],N=9;
    for(let j=0;j<=N;j++)for(let col=0;col<3;col++){
     const v=j/N,u=col-1,q=root.clone().addScaledVector(dir,length*v).addScaledVector(cross,u*.021*Math.pow(Math.sin(Math.PI*v),.8)*(1-.35*t));q.y+=.016*Math.sin(Math.PI*v)*(1-u*u)-.012*v*v;
     p.push(q.x,q.y,q.z);uv.push(col/2,v);const tone=.69+.35*random()+.10*v;colors.push(tone*.87,tone,tone*.58);
     if(j<N&&col<2){const at=j*3+col;ix.push(at,at+1,at+3,at+1,at+4,at+3);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();leaves.push(g);
   }
  }
  const wg=mergeGeometries(wood,false),lg=mergeGeometries(leaves,false),g=mergeGeometries([wg,lg],true);for(const part of[...wood,...leaves,wg,lg])part.dispose();g.computeBoundingBox();g.computeBoundingSphere();const size=g.boundingBox.getSize(new T.Vector3());variants.push({name:'authored-frond-fern212-'+variant,geometry:g,material:[stem,leaf],height:size.y,radius:Math.hypot(size.x,size.z)/2});
 }
 return{id:'fern212',source:'Independent authored radiating fronds with paired curved pinnae, not a species scan',license:'Original project-authored geometry',variants};
}
