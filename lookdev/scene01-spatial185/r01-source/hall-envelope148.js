import {layout124 as L} from './layout124.js';

// Physical underside of the actual148 main roof; the same halfhip transition
// and curvature as architecture.roof. Receivers use this at each timber node.
export function mainHallUnderside148(x,z){
 const halfW=12.75,halfD=6.8,ridge=halfW*.53,gableStart=.44,localZ=z+.35;
 const tz=Math.abs(localZ)/halfD,tx=Math.abs(x)>ridge?gableStart+(Math.abs(x)-ridge)/(halfW-ridge)*(1-gableStart):0,t=Math.max(tx,tz);
 const span=ridge+(halfW-ridge)*Math.max(0,(t-gableStart)/(1-gableStart)),u=tz>=tx?x/span:localZ/(halfD*t);
 return L.hall.upperEave+L.hall.mainRoofRise*Math.pow(Math.max(0,1-t),1.46)+.59*Math.pow(t,8)*(.25+.75*Math.pow(Math.abs(u),5))-.16;
}
