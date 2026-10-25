import * as T from 'three';
import {cast275,ribbon275,craftCollector275,ring275} from './corner-craft275.js';

// Worked square metal end cup. The narrow folded sleeve, coffered field,
// three raised flower ranks and return chasing are independent solids.
export function createHipBoot275(){
 const c=craftCollector275('scene05-chased-hip-end-cup275'),add=c.add,bright='fittingEdge',metal='fittingCopper',dark='fittingPatina';
 function rect(w,h,r=.015){const a=w/2,b=h/2,s=new T.Shape();s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);s.closePath();return s;}
 function squareRing(w,h,b,depth,z,m=bright){const s=rect(w,h);s.holes.push(new T.Path(rect(w-2*b,h-2*b,.009).getPoints(12)));add(cast275(s,depth,.001),m,[0,0,z]);}
 squareRing(1,1,.011,.282,-.131,metal);
 add(cast275(rect(.970,.970),.011,.001),dark,[0,0,.007]);
 squareRing(.998,.998,.012,.009,.020,bright);squareRing(.946,.946,.009,.008,.018,metal);squareRing(.900,.900,.007,.007,.024,bright);
 const coffer=rect(.877,.877,.014),hole=new T.Path();hole.absarc(0,0,.355,0,Math.PI*2,true);coffer.holes.push(hole);add(cast275(coffer,.007,.0008),metal,[0,0,.021]);
 add(ring275(.359,.359,0,.025,.0045,112),bright);add(ring275(.345,.345,0,.026,.003,112),metal);
 function petal(length,width,front=.040){
  const N=14,K=12,p=[0,.046,.022],uv=[0,0],ix=[];
  for(let j=1;j<N;j++)for(let k=0;k<K;k++){const t=j/N,a=k/K*Math.PI*2,shape=Math.sin(Math.PI*t),x=Math.sin(a)*width*shape**.7,z=.022+Math.cos(a)*(.003+(front-.025)*shape)-.004*shape*Math.exp(-Math.pow(x/.005,2))*Math.max(0,Math.cos(a));p.push(x,.046+length*t,z);uv.push(k/K,t);}
  const end=p.length/3;p.push(0,.046+length,.023);uv.push(0,1);for(let k=0;k<K;k++)ix.push(0,1+(k+1)%K,1+k);for(let j=0;j<N-2;j++)for(let k=0;k<K;k++){const a=1+j*K+k,b=1+j*K+(k+1)%K,d=a+K,e=b+K;ix.push(a,b,d,b,e,d);}const last=1+(N-2)*K;for(let k=0;k<K;k++)ix.push(end,last+k,last+(k+1)%K);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 for(let k=0;k<32;k++){const g=petal(k%2?.278:.301,k%2?.023:.025,.039);g.rotateZ(k*Math.PI/16);add(g,bright);}
 for(let k=0;k<16;k++){const g=petal(.160,.023,.046);g.rotateZ((k+.5)*Math.PI/8);g.translate(0,0,.006);add(g,metal);}
 const boss=new T.SphereGeometry(1,20,12);boss.scale(.041,.041,.014);add(boss,bright,[0,0,.039]);
 for(let q=0;q<4;q++){
  const a=q*Math.PI/2,points=[[-.050,-.035,.027],[-.080,.008,.032],[-.038,.068,.033],[.025,.052,.029],[.042,.008,.031],[.003,-.012,.033]].map(([x,y,z])=>[x+.365,y+.365,z]);const g=ribbon275(points,.018,.008,{segments:32});g.rotateZ(a);add(g,bright);
  // Six shallow incised-looking bands are raised metal with real narrow
  // channels over the finite dark floor, and turn onto the actual sleeve.
  for(let k=0;k<4;k++){const g=ribbon275([[-.30+k*.20,.055,.003],[-.26+k*.20,.115,.007],[-.30+k*.20,.175,.004]],.012,.006,{segments:20});g.rotateX(-Math.PI/2);g.translate(0,.498,0);g.rotateZ(a);add(g,metal);}
  for(const x of[-.435,0,.435]){const stud=new T.SphereGeometry(1,10,6);stud.scale(.0075,.008,.004);stud.translate(x,.467,.029);stud.rotateZ(a);add(stud,bright);}
 }
 const r=c.finish();return{...r,info:{revision:'corner275-r04-seated-return-chasing',solidAudit:r.audit,construction:'Closed thin282mm-normalized folded sleeve with stepped coffer, dark continuous floor,32 narrow outer repousse petals and16 inner petals, genuine recessed centre veins, double beaded round moulding, corner curled chasing, worked returns and struck fasteners',normalizedFace:[1,1],returnDepth:.282,referencePhotographRuntimeUse:false,visualAccepted:false}};
}
