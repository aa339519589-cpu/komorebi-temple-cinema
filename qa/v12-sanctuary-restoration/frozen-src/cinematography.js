import * as T from 'three';

// Low physical camera heights, deliberate arcs, and continuous movement through each cut.
// Garden cameras remain below 1.8 m; the sanctuary camera is 0.65 m above its floor.
export const shots=[
{name:'灯火与巨构 · Threshold',from:[-17.3,1.05,15],c1:[-18.5,1.05,23],c2:[-17,1.0,34],to:[-18,.9,44],look0:[-17,2.4,10],look1:[-1,19,-11],fov:48},
{name:'廊下仰望 · Veranda',from:[24.5,1.25,10],c1:[24,1.2,17],c2:[18,.9,25],to:[15,.9,30],look0:[22.2,4.0,6],look1:[-4,16,-13],fov:50},
{name:'莲与殿影 · Lotus',from:[-1.4,.50,19.6],c1:[-2,.55,21],c2:[-5,.65,24],to:[-8,.7,25],look0:[-1.5,1.0,16],look1:[2,19,-11],fov:50},
{name:'朝殿 · Procession',from:[6,.9,14],c1:[5.5,1.1,22],c2:[6.6,1.1,34],to:[6,.9,42],look0:[6,.7,10],look1:[6,13.5,-6],fov:44},
{name:'仰见五重 · Pagoda',from:[-31.5,.9,-14.5],c1:[-36,.9,-10],c2:[-41,.9,-4],to:[-40,.9,4],look0:[-29,9.5,-17.5],look1:[-21.5,25,-25],fov:44},
{name:'礼佛 · Reverence',from:[6.3,6.65,-9.5],c1:[6.15,6.65,-7],c2:[5.8,6.65,-4.5],to:[6,6.65,-2],look0:[6,13.0,-15.4],look1:[6,11.8,-15],fov:48},
{name:'柱间伽蓝 · Great hall',from:[24.1,1.2,15.5],c1:[24.1,1.2,23],c2:[22,1.0,27],to:[18,.9,30],look0:[22,1.3,12],look1:[0,18,-10],fov:44},
{name:'深院高檐 · Passage',from:[-30,.9,0],c1:[-30,.9,8],c2:[-22,.9,20],to:[-14,.9,26],look0:[-26,4.8,-6],look1:[-7,20,-21],fov:46},
{name:'水映高殿 · Reflection',from:[16.5,.65,19],c1:[16,.7,22],c2:[13,.7,25],to:[12,.65,27],look0:[14.5,1.0,16],look1:[-5,15,-13],fov:48},
{name:'雨后朝光 · Ascension',from:[-4.5,.55,24],c1:[-7,.7,29],c2:[-12,.8,38],to:[-16,.9,44],look0:[-4,.12,21],look1:[1,19,-11],fov:46}
];
const v=a=>new T.Vector3(...a);
const paths=shots.map(s=>new T.CubicBezierCurve3(v(s.from),v(s.c1),v(s.c2),v(s.to)));
export function cameraPoseForShot(index,localTime){
 const u=localTime/7,s=shots[index],path=paths[index];
 // Keep nonzero velocity at edit points; no stop-and-start quintic zooms.
 const speed=.80*u+.20*u*u*(3-2*u);
 let position;
 if(speed<0)position=path.getPointAt(0).addScaledVector(path.getTangentAt(0),speed*path.getLength());
 else if(speed>1)position=path.getPointAt(1).addScaledVector(path.getTangentAt(1),(speed-1)*path.getLength());
 else position=path.getPointAt(speed);
 const direction0=v(s.look0).sub(v(s.from)).normalize(),direction1=v(s.look1).sub(v(s.to)).normalize();
 const rotation=new T.Quaternion().setFromUnitVectors(direction0,direction1),orient=.85*speed+.15*speed*speed*(3-2*speed);
 const direction=direction0.clone().applyQuaternion(new T.Quaternion().slerp(rotation,orient));
 const physicalAnchor=v(s.look0).lerp(v(s.look1),speed),focus=Math.max(.3,physicalAnchor.sub(position).dot(direction)),target=position.clone().addScaledVector(direction,focus);
 return{index,position,target,fov:s.fov,u};
}
export function cameraPose(time){
 const t=Math.max(0,Math.min(69.999999,time)),index=Math.floor(t/7);
 return cameraPoseForShot(index,t-index*7);
}
