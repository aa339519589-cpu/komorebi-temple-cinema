import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {noise,surface} from './kernel.js';

// Real concave pan tiles, overlapped cover courses and fired ceramic end
// profiles. Geometry follows the existing physical roof, including its hips.
export function createCeramicRoof161(B){
 const pans=[],variants=new Map();
 const mat=B.m.slate.clone();mat.name='hall161-concave-pan-ceramic';mat.vertexColors=true;mat.roughness=.65;mat.clearcoat=.09;mat.clearcoatRoughness=.39;B.m.hall161Pan=mat;
 const lip=new T.LatheGeometry([[0,-.07],[.72,-.07],[.91,-.06],[1,-.02],[1,.055],[.94,.14],[.83,.14],[.75,.065],[.20,.035],[0,.04]].map(p=>new T.Vector2(...p)),32).toNonIndexed();
 const flower=new T.Shape();for(let j=0;j<=112;j++){const a=j/112*Math.PI*2,r=.41+.14*Math.pow(.5+.5*Math.cos(a*14),.78),x=Math.cos(a)*r,y=Math.sin(a)*r;j?flower.lineTo(x,y):flower.moveTo(x,y);}flower.closePath();
 const relief=new T.ExtrudeGeometry(flower,{depth:.059,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2});relief.rotateX(-Math.PI/2);relief.translate(0,.041,0);
 const cap=mergeGeometries([lip,relief.index?relief.toNonIndexed():relief]);lip.dispose();relief.dispose();
 const field=(x,z)=>.82+.27*noise(x*.33,z*.38,161)+.055*noise(x*9.1,z*8.3,166);
 return{
  field,
  cover(geometry,matrix,tint){
   const x=matrix.elements[12],z=matrix.elements[14],key=Math.floor(noise(x*19.7,z*21.3,168)*8)%8;
   if(!variants.has(key)){
    const g=geometry.clone(),uv=g.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setXY(j,uv.getX(j)*(.72+.035*(key%3))+(key*.173)%1,uv.getY(j)*.79+(key*.293)%1);
    variants.set(key,g);
   }
   B.put(variants.get(key),'slate',matrix,tint*field(x,z));
  },
  cap(end,side,r){
   B.emit(cap,'tileEdge',end[0],end[1]+.017,end[2]+(side===0?.033:side===2?-.033:0),r,r,r,side===0||side===2?[Math.PI/2,0,0]:[0,0,Math.PI/2],field(end[0],end[2]));
  },
  pan(P,side,t0,t1,u0,u1){
   if(t1-t0<.0001)return;
   const grid=Array.from({length:4},(_,j)=>Array.from({length:9},(_,k)=>{
    const t=t0+(t1-t0)*j/3,s=k/8,p=P(side,t,u0+(u1-u0)*s);
    p[1]+=.025+.020*Math.pow(2*s-1,2)+.006*Math.pow(1-j/3,5);return p;
   }));
   const g=surface(grid,.018),pos=g.attributes.position,color=new Float32Array(pos.count*3);
   for(let j=0;j<pos.count;j++){const v=field(pos.getX(j),pos.getZ(j));color.set([v,v,v],j*3);}
   g.setAttribute('color',new T.Float32BufferAttribute(color,3));pans.push(g);
  },
  finish(){
   if(!pans.length)return;
   const g=mergeGeometries(pans);g.name='hall161-closed-overlapping-concave-ceramic-pans';B.emit(g,mat);for(const p of pans)p.dispose();
  }
 };
}
