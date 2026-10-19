import * as T from 'three';

// One connected, irregular garden pine replaces the two near radial crowns.
// The supplied photograph supplies silhouette observations only, never pixels.
export function buildGardenPine130({emit,needleG,blocked=()=>false},terrain){
 let state=130803;const rand=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296),rr=(a,b)=>a+(b-a)*rand(),root=[2.7,terrain.heightAt(2.7,-11.3)-.035,-11.3],V=p=>new T.Vector3(p[0]+root[0],p[1]*.80+root[1],p[2]+root[2]);
 const trunk=[[0,0,0],[-.15,1.15,-.20],[-.55,2.65,-.40],[-.35,4,-.35],[-.60,5.55,-.2]],bounds=new T.Box3(),needleBounds=new T.Box3(),solids=[];let packets=0,prunedTwigs=0,prunedBoughs=0,skipPad=false;
 function branch(a,b,r0,r1,label){if(skipPad)return;a=V(a);b=V(b);const d=b.clone().sub(a),g=new T.CylinderGeometry(r1,r0,d.length()+.015,10);g.name=label;g.userData.corridor130={closed:true,role:'connected-pine-branch'};const rot=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())),c=a.clone().add(b).multiplyScalar(.5);emit(g,'bark',c.x,c.y,c.z,1,1,1,[rot.x,rot.y,rot.z]);bounds.expandByPoint(a);bounds.expandByPoint(b);solids.push(label);}
 for(let i=0;i<trunk.length-1;i++)branch(trunk[i],trunk[i+1],.25-i*.044,.205-i*.044,'corridor130-pine-trunk-'+i);
 function onTrunk(f){const t=f*(trunk.length-1),i=Math.min(trunk.length-2,Math.floor(t)),a=trunk[i],b=trunk[i+1];return a.map((v,j)=>v+(b[j]-v)*(t-i));}
 const pads=[
  {f:.34,tip:[-1.0,2.25,-.75],r:[.62,.42]},
  {f:.47,tip:[-.95,3.35,.45],r:[.55,.45]},
  {f:.55,tip:[1.50,4.2,3.4],r:[.70,.55]},
  {f:.60,tip:[-.90,4.15,.25],r:[.55,.45]},
  {f:.68,tip:[2,4.7,3.7],r:[.82,.58]},
  {f:.78,tip:[-.95,5,-.3],r:[.63,.48]},
  {f:.93,tip:[-.45,5.65,-.75],r:[.55,.43]},
  {f:.86,tip:[1,5.25,3.0],r:[.66,.48]},
  {f:.60,tip:[-.2,4,-2],r:[.63,.43]},
 ];
 for(const [i,pad]of pads.entries()){
  const start=onTrunk(pad.f),tip=pad.tip,mid=start.map((v,j)=>v+(tip[j]-v)*.58+(j===1?-.15:0));skipPad=blocked(V(start).toArray(),V(mid).toArray(),.10)||blocked(V(mid).toArray(),V(tip).toArray(),.065);if(skipPad)prunedBoughs++;branch(start,mid,.10-i*.004,.065,'corridor130-pine-bough-'+i+'a');branch(mid,tip,.065,.035,'corridor130-pine-bough-'+i+'b');
  for(let k=0;k<5;k++){
   const a=k*2.39996+i*.63,end=[tip[0]+Math.cos(a)*pad.r[0]*.65,tip[1]+rr(.03,.24),tip[2]+Math.sin(a)*pad.r[1]*.65];const forkBlocked=skipPad||blocked(V(tip).toArray(),V(end).toArray(),.04);if(!forkBlocked)branch(tip,end,.027,.012,'corridor130-pine-fork-'+i+'-'+k);
   for(let j=0;j<4;j++){
    const b=a+(j-1.5)*.67,base=tip.map((v,n)=>v+(end[n]-v)*.56),fine=[end[0]+Math.cos(b)*pad.r[0]*.46,end[1]+rr(.05,.26),end[2]+Math.sin(b)*pad.r[1]*.46];const fineBlocked=forkBlocked||blocked(V(base).toArray(),V(fine).toArray(),.065);if(fineBlocked)prunedTwigs++;else branch(base,fine,.010,.0035,'corridor130-pine-twig-'+i+'-'+k+'-'+j);
    for(let n=0;n<220;n++){
     const t=rand(),az=rr(0,Math.PI*2),spread=rr(.01,.055),p=base.map((v,j)=>v+(fine[j]-v)*t);p[0]+=Math.cos(az)*spread;p[1]+=rr(-.025,.06);p[2]+=Math.sin(az)*spread;const w=V(p),size=rr(.26,.42);const rotation=[rr(-.6,.6),az,rr(-.75,.75)],tint=rr(.82,1.13);if(!fineBlocked){emit(needleG,'pine',w.x,w.y,w.z,size,size,size,rotation,tint);bounds.expandByPoint(w);needleBounds.expandByPoint(w);packets++;}
    }
   }
  }
 }
 return{revision:'connected-irregular-central-garden-pine130',root,soilY:root[1]+.035,trunkPath:trunk.map(p=>V(p).toArray()),primaryBoughs:pads.length,closedBranchSegments:solids.length,needlePackets:packets,prunedBoughs,prunedTwigs,worldBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},worldCrownBounds:{min:needleBounds.min.toArray(),max:needleBounds.max.toArray()},seed:130803,role:'One rooted garden pine with independently connected, uneven branch pads',limits:'Manual single-view silhouette interpretation; individual needles retain existing real mesh bundles',visualAccepted:false};
}
