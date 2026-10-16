import * as T from 'three';

// Low physical camera heights, deliberate arcs, and continuous movement through each cut.
// Garden cameras remain below 1.8 m; the sanctuary camera is 0.65 m above its floor.
export const shots=[
{name:'灯火与巨构 · Threshold',from:[-17.3,1.05,15],c1:[-18.5,1.05,23],c2:[-24,1.3,34],to:[-22,1.5,42],look0:[-17,2.4,10],look1:[-1,19,-11],fov:48},
{name:'廊下仰望 · Veranda',from:[25.5,1.25,10],c1:[26.5,1.35,17],c2:[32,1.5,27],to:[30,1.5,36],look0:[22.2,4.0,6],look1:[6,18,-11],fov:46},
{name:'莲与殿影 · Lotus',from:[-1.4,.50,15.9],c1:[-2,.65,22],c2:[-6,1.0,33],to:[-12,1.3,38],look0:[-1,1.1,12],look1:[-2,17,-11],fov:46},
{name:'朝殿 · Procession',from:[6,.9,14],c1:[5.5,1.1,18],c2:[6.6,1.35,24],to:[6,1.5,29],look0:[6,.7,10],look1:[6,15,-5],fov:44},
{name:'仰见五重 · Pagoda',from:[-16.8,1.3,-5.4],c1:[-16.7,1.3,6],c2:[-13,1.4,22],to:[-9,1.5,39],look0:[-21.5,8.8,-9.7],look1:[-21.5,22,-17],fov:44},
{name:'礼佛 · Reverence',from:[6.3,6.65,-6],c1:[6.15,6.65,-3.5],c2:[5.8,6.65,-.5],to:[6,6.65,2.0],look0:[6,11.3,-15.4],look1:[6,11.8,-15],fov:44},
{name:'柱间伽蓝 · Great hall',from:[24.1,1.2,15.5],c1:[25,1.3,20],c2:[30,1.5,26],to:[31,1.8,32],look0:[22,1.3,12],look1:[6,17,-11],fov:44},
{name:'深院高檐 · Passage',from:[-30,1.2,0],c1:[-33,1.2,6],c2:[-39,1.5,21],to:[-36,1.6,31],look0:[-26,4.8,-6],look1:[-7,18,-10],fov:46},
{name:'水映高殿 · Reflection',from:[14,.65,19],c1:[17,.8,24],c2:[26,1,33],to:[29,1.2,40],look0:[12,.8,16],look1:[1,17,-10],fov:45},
{name:'雨后朝光 · Ascension',from:[-4.5,.55,24],c1:[-7,.7,29],c2:[-12,1.0,38],to:[-16,1.5,44],look0:[-4,.12,21],look1:[1,19,-11],fov:46}
];
const v=a=>new T.Vector3(...a);
const paths=shots.map(s=>new T.CubicBezierCurve3(v(s.from),v(s.c1),v(s.c2),v(s.to)));
export function cameraPose(time){
 const t=Math.max(0,Math.min(69.999999,time)),index=Math.floor(t/7),u=(t-index*7)/7,s=shots[index];
 // Keep nonzero velocity at edit points; no stop-and-start quintic zooms.
 const speed=.80*u+.20*u*u*(3-2*u),position=paths[index].getPointAt(speed);
 const a=v(s.look0),b=v(s.look1),target=a.lerp(b,.70*speed+.30*speed*speed*(3-2*speed));
 return{index,position,target,fov:s.fov,u};
}
