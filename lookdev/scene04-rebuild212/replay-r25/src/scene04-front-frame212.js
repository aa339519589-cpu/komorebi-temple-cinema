import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// HD04-led timber reconstruction. Closed load-bearing solids and actual
// carved relief receive ordinary light/shadows; no reference image projection.
function solid(p,id,tag){
 let volume=0;for(let i=0;i<id.length;i+=3){const a=new T.Vector3().fromArray(p,id[i]*3),b=new T.Vector3().fromArray(p,id[i+1]*3),c=new T.Vector3().fromArray(p,id[i+2]*3);volume+=a.dot(b.cross(c))/6;}
 if(volume<0)for(let i=0;i<id.length;i+=3)[id[i+1],id[i+2]]=[id[i+2],id[i+1]];
 const uv=[];for(let i=0;i<p.length;i+=3)uv.push(p[i]/1.45,p[i+1]/.38);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(id);g.computeVertexNormals();g.userData.architectureMember=tag;g.userData.frontFrame212={closed:true,source:'Independent HD04 proportion reconstruction',referenceImageUsedAsTexture:false};return g;
}
export function createHeavyKarahafu212(profile){
 const z=profile.front,raw=[[-.025,z-.22],[-.025,z+.075],[-.070,z+.155],[-.115,z+.185],[-.165,z+.180],[-.185,z+.140],[-.220,z+.125],[-.235,z+.155],[-.285,z+.150],[-.310,z+.135],[-.335,z+.120],[-.375,z-.030],[-.585,z-.245],[-.565,z-.245],[-.355,z-.310],[-.120,z-.295]],section=[];
 // Real 8mm profile arrises reveal a moving narrow highlight on the curved
 // timber. The fitted span, crown, receiving axes and section envelope stay.
 for(let i=0;i<raw.length;i++){const b=new T.Vector2(...raw[i]),a=new T.Vector2(...raw[(i+raw.length-1)%raw.length]),c=new T.Vector2(...raw[(i+1)%raw.length]),trim=Math.min(.008,b.distanceTo(a)*.22,b.distanceTo(c)*.22),p=b.clone().lerp(a,trim/b.distanceTo(a)),q=b.clone().lerp(c,trim/b.distanceTo(c));for(let k=0;k<=3;k++){const t=k/3,s=1-t;section.push([s*s*p.x+2*s*t*b.x+t*t*q.x,s*s*p.y+2*s*t*b.y+t*t*q.y]);}}
 const p=[],id=[],uv=[],N=216,M=section.length,across=[0];let along=0,previous=null;for(let k=1;k<M;k++)across[k]=across[k-1]+Math.hypot(section[k][0]-section[k-1][0],section[k][1]-section[k-1][1]);
 for(let j=0;j<=N;j++){
  const x=-profile.half+2*profile.half*j/N,slope=(profile.canopy(x+.001,z)-profile.canopy(x-.001,z))/.002,n=1/Math.hypot(1,slope);
  const y=profile.canopy(x,z);if(previous)along+=Math.hypot(x-previous[0],y-previous[1]);previous=[x,y];
  for(let k=0;k<M;k++){const[dy,zz]=section[k];p.push(x-dy*slope*n,y+dy*n,zz);uv.push(along/1.45+.37,across[k]/.38+.23);}
 }
 for(let j=0;j<N;j++)for(let k=0;k<M;k++){const q=(k+1)%M,a=j*M+k,b=j*M+q,c=(j+1)*M+k,d=(j+1)*M+q;id.push(a,c,b,b,c,d);}
 const caps=T.ShapeUtils.triangulateShape(section.map(q=>new T.Vector2(...q)),[]);for(const[a,b,c]of caps){id.push(a,b,c);const o=N*M;id.push(o+a,o+c,o+b);}
 const g=solid(p,id,'entrance-saddled-bargeboard');g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.userData.frontFrame212.sectionDepthMetres=.560;g.userData.frontFrame212.foreAftDepthMetres=.495;g.userData.frontFrame212.profileArrisMetres=.008;g.userData.frontFrame212.grain='Metric arc length along the actual compound hafu; transverse section perimeter across grain.';return g;
}
export function cloudTransferEnvelope212(x,width,height,bow=.08){
 const u=2*x/width,belly=1-u*u,shoulder=Math.exp(-Math.pow((Math.abs(u)-.79)/.13,2)),endCurl=Math.exp(-Math.pow((Math.abs(u)-.96)/.065,2));
 return{top:height*.48+bow*belly+.070*shoulder+.05*endCurl,bottom:-height*.40-.075*Math.exp(-Math.pow(u/.43,2))+.070*Math.pow(Math.abs(u),3)-.050*shoulder,frontBulge:.085*belly+.015*Math.cos(u*Math.PI*2)};
}
export function createCloudTransfer212({width=6.95,height=.49,y=9.2,z=.83,bow=.08,label='upper'}={}){
 const p=[],id=[],sections=[],N=224;
 for(let j=0;j<=N;j++){
  const x=-width/2+width*j/N,e=cloudTransferEnvelope212(x,width,height,bow),top=y+e.top,bottom=y+e.bottom,zf=z+e.frontBulge,r=[[top,z-.70],[top,zf-.045],[top-.025,zf+.010]];
  for(let k=1;k<18;k++){const t=k/18;r.push([T.MathUtils.lerp(top-.025,bottom+.025,t),zf+.010+.055*Math.sin(Math.PI*t)]);}
  r.push([bottom+.025,zf+.010],[bottom,zf-.050],[bottom,z-.70]);sections.push(r);for(const[yy,zz]of r)p.push(x,yy,zz);
 }
 const M=sections[0].length;for(let j=0;j<N;j++)for(let k=0;k<M;k++){const q=(k+1)%M,a=j*M+k,b=j*M+q,c=(j+1)*M+k,d=(j+1)*M+q;id.push(a,c,b,b,c,d);}
 for(const j of[0,N])for(const[a,b,c]of T.ShapeUtils.triangulateShape(sections[j].map(q=>new T.Vector2(...q)),[]))id.push(j*M+a,j*M+b,j*M+c);
 return solid(p,id,'scene04-212-'+label+'-cloud-ended-bearing-transfer');
}

// Readable primary sculpture above the fine carved field: intertwined stems,
// spiral cloud curls and closed tapered leaves, all with real front/back depth.
export function createRaisedScrollVine212({width=6.10,height=.36,y=9.2,z=.9,phase=0}={}){
 const parts=[],front=x=>z+.085*Math.max(0,1-Math.pow(x/3.475,2))+.015*Math.cos(x/3.475*Math.PI*2)+.057,stemY=x=>y+.060*Math.sin(x*2.15+phase);
 const tube=(points,r=.018)=>parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(16,points.length*5),r,7,false));
 const spine=[];for(let i=0;i<=64;i++){const x=-width/2+width*i/64;spine.push(new T.Vector3(x,stemY(x),front(x)));}tube(spine,.022);
 function leaf(x,yy,angle,length=.18,breadth=.052){
  const p=[],id=[],N=14,R=10;
  for(let j=0;j<=N;j++){const t=.008+.984*j/N,arc=Math.sin(Math.PI*t),u=length*t,v=breadth*Math.pow(arc,.82);for(let k=0;k<R;k++){const a=k*Math.PI*2/R,side=v*Math.cos(a),depth=.025*Math.pow(arc,.75)*Math.sin(a);p.push(x+u*Math.cos(angle)-side*Math.sin(angle),yy+u*Math.sin(angle)+side*Math.cos(angle),front(x)+.010+.022*arc+depth);}}
  for(let j=0;j<N;j++)for(let k=0;k<R;k++){const n=(k+1)%R,a=j*R+k,b=j*R+n,c=(j+1)*R+k,d=(j+1)*R+n;id.push(a,c,b,b,c,d);}
  for(const j of[0,N]){const centre=p.length/3,t=.008+.984*j/N;p.push(x+length*t*Math.cos(angle),yy+length*t*Math.sin(angle),front(x)+.010+.022*Math.sin(Math.PI*t));for(let k=0;k<R;k++)id.push(centre,j*R+k,j*R+(k+1)%R);}
  parts.push(solid(p,id,'scene04-212-closed-gilt-scroll-leaf'));
 }
 for(let k=0;k<17;k++){
  const x=-width*.45+k*width*.90/16,side=k%2?1:-1,yy=stemY(x),len=.135+.035*(.5+.5*Math.sin(k*1.73));leaf(x,yy,side*(.50+.18*Math.sin(k)),len,.038);
 }
 for(const x of[-width*.39,-width*.20,width*.20,width*.39]){
  const side=x<0?-1:1,cy=y+.010,points=[];for(let i=0;i<=58;i++){const t=i/58,a=-Math.PI*.6+side*t*Math.PI*3.15,r=height*(.36-.29*t),xx=x+Math.cos(a)*r;points.push(new T.Vector3(xx,cy+Math.sin(a)*r,front(xx)+.012));}tube(points,.016);
 }
 for(let k=0;k<10;k++){const a=k*Math.PI*2/10;leaf(0,y,a,height*.43,.044);}parts.push(new T.SphereGeometry(.052,14,10).scale(1,1,.42).translate(0,y,front(0)+.037));
 const g=mergeGeometries(parts,false);parts.forEach(q=>q.dispose());g.userData.architectureMember='scene04-212-raised-intertwined-scroll-vine';g.userData.frontFrame212={source:'Independent inferred primary cloud-scroll/hosoge-like sculpture',referenceImageUsedAsTexture:false,primaryLeaves:27,realSpiralStems:4};return g;
}
