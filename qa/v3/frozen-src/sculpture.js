import * as T from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// One continuous isosurface, including shoulders, elbows and crossed legs.
// The folds are cut into the sculpted surface; there are no overlaid wire ribs.
export function seatedFigure(){
 const resolution=176,mc=new MarchingCubes(resolution,undefined,false,false,300000);
 mc.isolation=0;
 const lo=[-1.85,1.48,-.82],size=[3.70,2.57,2.06];
 const ellipsoids=[
  [0,2.09,.12,1.02,.43,.59],[-.73,1.99,.40,.90,.33,.57],[.73,1.99,.40,.90,.33,.57],
  [0,2.77,-.035,.64,.73,.425],[0,3.21,-.035,.70,.43,.40],[0,3.69,-.045,.205,.32,.195]
 ];
 const arms=[[-.60,3.38,.015,-.86,2.70,.29,.20,.15],[-.86,2.70,.29,-.25,2.34,.64,.155,.105],
             [.60,3.38,.015,.86,2.73,.29,.19,.145],[.86,2.73,.29,.73,3.48,.57,.14,.092]];
 const capsules=arms.map(([ax,ay,az,bx,by,bz,ra,rb])=>{
  const dx=bx-ax,dy=by-ay,dz=bz-az;return[ax,ay,az,dx,dy,dz,ra,rb,1/(dx*dx+dy*dy+dz*dz)];
 });
 const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
 for(let iz=0;iz<resolution;iz++){
  const z=lo[2]+iz/resolution*size[2];
  for(let iy=0;iy<resolution;iy++){
   const y=lo[1]+iy/resolution*size[1];
   for(let ix=0;ix<resolution;ix++){
    const x=lo[0]+ix/resolution*size[0];let d=10;
    for(const [cx,cy,cz,rx,ry,rz] of ellipsoids){
     const px=x-cx,py=y-cy,pz=z-cz;
     const k0=Math.sqrt(px*px/(rx*rx)+py*py/(ry*ry)+pz*pz/(rz*rz));
     const k1=Math.sqrt(px*px/(rx**4)+py*py/(ry**4)+pz*pz/(rz**4));
     const e=k0*(k0-1)/Math.max(k1,.00001);d=smoothMin(d,e,.17);
    }
    for(const [ax,ay,az,dx,dy,dz,ra,rb,il] of capsules){
     const px=x-ax,py=y-ay,pz=z-az,t=T.MathUtils.clamp((px*dx+py*dy+pz*dz)*il,0,1);
     const c=Math.hypot(px-t*dx,py-t*dy,pz-t*dz)-(ra+(rb-ra)*t);d=smoothMin(d,c,.12);
    }
    // The left shoulder carries the robe. Broad, irregular catenary folds fall
    // diagonally across the chest, then fan out over the crossed knees.
    if(z>.08&&y>1.72&&y<3.52){
     const front=T.MathUtils.smoothstep(z,.08,.36),cloth=T.MathUtils.smoothstep(3.35-y-x*.55,-.08,.12);
     let folds=0;
     for(let j=0;j<7;j++){
      const yy=3.38-j*.145-.24*(x+.53)-.14*Math.sin((x+.66)*1.8+j*.11);
      const w=.027+j*.002;folds+=.013*Math.exp(-(((y-yy)/w)**2))-.008*Math.exp(-(((y-yy-.052)/(w*1.7))**2));
     }
     const lap=Math.exp(-(((y-1.97)/.25)**2));
     folds+=lap*(.004*Math.sin(21*x+4*Math.sin(6*y)+1.4*z)+.002*Math.sin(37*x+9*y));
     d+=front*cloth*folds;
    }
    mc.field[iz*resolution*resolution+iy*resolution+ix]=-d;
   }
  }
 }
 mc.update();
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(mc.positionArray.slice(0,mc.count*3),3));
 g.setAttribute('normal',new T.Float32BufferAttribute(mc.normalArray.slice(0,mc.count*3),3));
 g.scale(size[0]/2,size[1]/2,size[2]/2);g.translate(lo[0]+size[0]/2,lo[1]+size[1]/2,lo[2]+size[2]/2);
 mc.geometry.dispose();
 return g;
}

// A wide, shallow relief with feather-like lobes and a softened, domed surface.
export function reliefPetal(){
 const g=new T.SphereGeometry(1,24,16),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),t=(y+1)/2;
  p.setXYZ(i,x*(.64+.36*t)*(1+.13*Math.sin(t*Math.PI*5)),y,z*.23*(.5+.5*Math.sin(t*Math.PI)));
 }
 g.computeVertexNormals();return g;
}
