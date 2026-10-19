import * as T from 'three';
// Metric construction under the fixed camera. Comparison points remain in QA.
export const FOREGROUND_FLOOR_PATCH=Object.freeze({x:[-1.8,-.6426572099440302,.5668326244412207,1.8],z:[3.8,5.195506379267121,5.955861541331324,6.573938442992812,7.4,8.35,9.3,10.1],thickness:.05,gap:.0009,bevel:.0004,limitations:'Two longitudinal seams and two transverse fragments are comparison-led. First transverse line is mat/glare ambiguous; unseen rows and perimeter are inferred.'});
export function createForegroundFloorPanel(x0,x1,z0,z1){
 const {gap,bevel:b,thickness:h}=FOREGROUND_FLOOR_PATCH,w=x1-x0-gap,d=z1-z0-gap,s=new T.Shape();s.moveTo(-w/2+b,-d/2+b);s.lineTo(w/2-b,-d/2+b);s.lineTo(w/2-b,d/2-b);s.lineTo(-w/2+b,d/2-b);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:h-2*b,steps:1,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:1,curveSegments:1});g.translate(0,0,-h+b);g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,0,(z0+z1)/2);
 const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/.8,Math.abs(n.getY(i))>.7?p.getZ(i)/.8:p.getY(i)/.8);
 g.userData.floorPanel={bounds:[x0+gap/2,x1-gap/2,z0+gap/2,z1-gap/2],topY:0,bottomY:-h,bevel:b,closedSolid:true};return g;
}
