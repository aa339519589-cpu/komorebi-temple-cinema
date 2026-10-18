import * as T from '../vendor/build/three.module.js';

// Fractured granite with a flattened foot and broad cleavage faces.
// A shared analytical field keeps coincident vertices watertight.
export function granite(seed=1){
 const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const r=1+.17*Math.sin(x*3.2+seed)*Math.sin(y*4.3+z*2.7)+.065*Math.cos(z*8.2+x*5.1+seed*2.3);
  x*=r;y*=r;z*=r;
  y=Math.min(y,.69+x*.16+Math.cos(z*3.1+seed)*.035);
  y=Math.max(y,-.66+x*.035-z*.026);
  x=Math.min(x,.85+y*.14-z*.09);
  p.setXYZ(i,x,y,z);
 }
 g.computeVertexNormals();return g;
}

export function grassTuft(){
 const p=[],id=[];
 for(let k=0;k<5;k++){
  const a=k*2.39996,c=Math.cos(a),s=Math.sin(a),h=.23+.07*Math.sin(k*9+2),start=p.length/3;
  for(let j=0;j<3;j++){
   const t=j/2,w=.023*(1-t)+.0005,r=.045+.20*t*t;
   p.push(c*r-s*w,h*t,s*r+c*w,c*r+s*w,h*t,s*r-c*w);
  }
  for(let j=0;j<2;j++){const n=start+j*2;id.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(id);g.computeVertexNormals();return g;
}

export function flagstone(seed=1){
 const c=.025+.035*(.5+.5*Math.sin(seed*9.17)),s=new T.Shape();
 const outline=[[-.5+c,-.5],[.5-c*.7,-.5],[.5,-.5+c*1.2],[.5,.5-c],[.5-c*1.3,.5],[-.5+c*.8,.5],[-.5,.5-c*.7],[-.5,-.5+c]];
 outline.forEach(([x,y],i)=>{const dx=.009*Math.sin(seed*5.1+i*8.3),dy=.009*Math.cos(seed*4.9+i*7.6);if(i)s.lineTo(x+dx,y+dy);else s.moveTo(x+dx,y+dy)});s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.96,steps:1,bevelEnabled:true,bevelThickness:.020,bevelSize:.009,bevelSegments:2});g.rotateX(-Math.PI/2);g.translate(0,-.48,0);return g;
}

export function timberSweep(points,width=.11,height=.11){
 const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=24;
 const hw=width/2,hh=height/2,b=.0075;
 const rim=[[-hw+b,-hh],[hw-b,-hh],[hw,-hh+b],[hw,hh-b],[hw-b,hh],[-hw+b,hh],[-hw,hh-b],[-hw,-hh+b]];
 const frames=Array.from({length:segments+1},(_,j)=>{
   const t=j/segments,centre=path.getPoint(t),tangent=path.getTangent(t).normalize();
   const side=new T.Vector3(tangent.z,0,-tangent.x).normalize(),up=new T.Vector3().crossVectors(tangent,side).normalize();
   return{centre,tangent,side,up};
 });
 const p=[],n=[],uv=[];
 const emit=(j,k,normal)=>{
   const f=frames[j],c=rim[k],v=f.centre.clone().addScaledVector(f.side,c[0]).addScaledVector(f.up,c[1]);
   p.push(...v.toArray());const nn=f.side.clone().multiplyScalar(normal[0]).addScaledVector(f.up,normal[1]).normalize();n.push(...nn.toArray());uv.push(k/8,j/segments);
 };
 for(let j=0;j<segments;j++)for(let k=0;k<8;k++){
   const next=(k+1)%8,a=rim[k],b=rim[next],nn=[(a[0]+b[0])/2,(a[1]+b[1])/2];
   for(const [jj,kk] of [[j,k],[j,next],[j+1,next],[j,k],[j+1,next],[j+1,k]])emit(jj,kk,nn);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
}
