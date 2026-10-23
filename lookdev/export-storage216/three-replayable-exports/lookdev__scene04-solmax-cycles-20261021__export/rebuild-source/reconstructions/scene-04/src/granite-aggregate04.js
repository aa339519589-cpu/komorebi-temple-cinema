let height=null,size=0,period=0;
export async function loadAggregateRelief04(){
 const root=new URL('../assets/granite-aggregate04/',import.meta.url),m=await(await fetch(new URL('manifest.json',root))).json();const bytes=await(await fetch(new URL(m.geometryHeight.file,root))).arrayBuffer();size=m.size;period=m.periodMetres;height=new Float32Array(bytes);if(height.length!==size*size)throw Error('Truncated metric aggregate height');return m;
}
export function sampleAggregateRelief04(x,z,seed){
 if(!height)throw Error('Metric aggregate must load before stone solids');const a=(seed*.417)%(2*Math.PI),cc=Math.cos(a),ss=Math.sin(a),wrap=v=>((v%1)+1)%1,u=wrap((x*cc+z*ss)/period+.137*seed)*size,v=wrap(1-wrap((-x*ss+z*cc)/period+.219*seed))*size,ix=Math.floor(u)%size,iy=Math.floor(v)%size,fx=u-Math.floor(u),fy=v-Math.floor(v),at=(dx,dy)=>height[((iy+dy)%size)*size+(ix+dx)%size];return .85*((at(0,0)*(1-fx)+at(1,0)*fx)*(1-fy)+(at(0,1)*(1-fx)+at(1,1)*fx)*fy);
}
