import * as T from 'three';
import {V,TAU,noise} from './kernel.js';

// Original repo-native geometry. The supplied photograph is measurement input
// only; no image pixels, projected photo planes or generated replacement frame.
export const hardware131={
 lantern:{position:[-3.53,6.94,8.35],scale:.9,yaw:.38,bodyRadius:.43,bodyBottom:-.48,bodyTop:.40,roofRadius:.64},
 finial:{heightInRadiusUnits:2.63,maximumSeatRadiusUnits:.82,domeRadiusUnits:.62,petals:8,carvedBandRepeats:10},
 revision:'scene01-hardware131-hexagonal-openwork-lantern-and-carved-giboshi'
};

function scalarTexture131(values,n=256){const t=new T.DataTexture(values,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.NoColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;}
export function installHardwareMaterials131(m){
 const bump=new Uint8Array(256*256*4),rough=new Uint8Array(bump.length),paper=new Uint8Array(bump.length);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const i=(y*256+x)*4,grain=noise(x*.57,y*.57,131),hammer=noise(x*.10,y*.10,92),scratch=Math.pow(Math.max(0,Math.sin(x*.81+2.2*noise(x*.03,y*.12,14))),34)*noise(x*.05,y*.07,23),fibre=.5+.15*Math.sin(x*.72+noise(x*.02,y*.05,38)*5)+.2*noise(x*.23,y*.23,12);
  for(let j=0;j<3;j++){bump[i+j]=Math.round(255*(.42+.15*grain+.12*hammer-.09*scratch));rough[i+j]=Math.round(255*(.55+.18*hammer+.13*grain));paper[i+j]=Math.round(255*fibre);}bump[i+3]=rough[i+3]=paper[i+3]=255;
 }
 const micro=scalarTexture131(bump),roughness=scalarTexture131(rough),fibre=scalarTexture131(paper);
 const metal=(name,color,r)=>new T.MeshPhysicalMaterial({name,color,metalness:.94,roughness:r,roughnessMap:roughness,bumpMap:micro,bumpScale:.00018,clearcoat:.025,clearcoatRoughness:.5,envMapIntensity:.72});
 m.hardwareBronze131=metal('hardware131-dark-cast-bronze',0x4e3518,.48);
 m.hardwareFinial131=metal('hardware131-worn-bronze-lotus-cap',0x6c4c24,.37);
 m.hardwareGold131=metal('hardware131-worn-gilt-brass',0xb18a44,.48);
 m.hardwarePatina131=metal('hardware131-recessed-blackened-bronze',0x2e251a,.64);
 m.hardwareRelief131=metal('hardware131-embossed-vegetal-brass',0xffffff,.52);m.hardwareRelief131.vertexColors=true;
 m.hardwareWood131=m.darkwood.clone();m.hardwareWood131.name='hardware131-wood-frame-with-inherited-CC0-cherry-scan';m.hardwareWood131.color.setRGB(2.6,1.8,1.05);m.hardwareWood131.clearcoat=.13;m.hardwareWood131.clearcoatRoughness=.40;
 m.hardwarePaper131=new T.MeshPhysicalMaterial({name:'hardware131-inner-fibrous-lantern-glazing',color:0xf2c271,emissive:0xffae44,emissiveIntensity:.48,roughness:.83,bumpMap:fibre,bumpScale:.00025,side:T.DoubleSide});
 return{revision:hardware131.revision,geometry:'Original analytic polygonal roof, pierced extruded floral screens, cast relief and fluted lotus/giboshi solids in foreground-hardware131.js',metalSurface:'Deterministic procedural micro-pitting, fine scratches and roughness; no reference-photo data',woodSurface:'Existing Poly Haven lacquered_cherry_wood CC0 scan via scanned-timber.js; member-aligned UV reused',referenceUsedAsTexture:false};
}

function indexedSolid131(p,index,name,colors=null){
 let volume=0;for(let i=0;i<index.length;i+=3){const a=V(p.slice(index[i]*3,index[i]*3+3)),b=V(p.slice(index[i+1]*3,index[i+1]*3+3)),c=V(p.slice(index[i+2]*3,index[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}if(volume<0)for(let i=0;i<index.length;i+=3)[index[i+1],index[i+2]]=[index[i+2],index[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((_,i)=>i%3===0?[p[i]*18,p[i+1]*18]:[]),2));if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(index);g.computeVertexNormals();g.name=name;g.userData.closedVolume=Math.abs(volume);return g;
}
function loft131(profile,sides,name,{polygon=false,flute=false}={}){
 const p=[],ix=[],at=(j,k)=>j*sides+(k+sides)%sides;
 for(let j=0;j<profile.length;j++)for(let k=0;k<sides;k++){
  const [r,y]=profile[j],a=k/sides*TAU+(polygon?Math.PI/6:0);let radius=r;
  if(flute&&y>1.20){const t=T.MathUtils.clamp((y-1.20)/1.25,0,1);radius+=.035*Math.sin(t*Math.PI)*Math.pow(.5+.5*Math.cos(a*8-t*.25),7);}
  if(flute&&y>.77&&y<1.10)radius+=.018*Math.pow(.5+.5*Math.cos(a*12),10);
  p.push(Math.sin(a)*radius,y,Math.cos(a)*radius);
 }
 for(let j=0;j<profile.length-1;j++)for(let k=0;k<sides;k++){const a=at(j,k),b=at(j,k+1),c=at(j+1,k),d=at(j+1,k+1);ix.push(a,b,c,b,d,c);}
 const bottom=p.length/3;p.push(0,profile[0][1],0);const top=p.length/3;p.push(0,profile.at(-1)[1],0);for(let k=0;k<sides;k++)ix.push(bottom,at(0,k+1),at(0,k),top,at(profile.length-1,k),at(profile.length-1,k+1));
 const g=indexedSolid131(p,ix,name);if(polygon){const flat=g.toNonIndexed();flat.computeVertexNormals();flat.name=name;flat.userData=g.userData;g.dispose();return flat;}return g;
}
function torus131(B,x,y,z,r,material='hardwareGold131',sx=1,sy=1,yaw=0){B.emit(new T.TorusGeometry(r,.008,8,32),material,x,y,z,sx,sy,1,[0,yaw,0]);}
function circleHole131(shape,x,y,r){const p=new T.Path();p.absellipse(x,y,r,r,0,TAU,true);shape.holes.push(p);}
function rectHole131(shape,x,y,w,h){const p=new T.Path();p.moveTo(x-w/2,y-h/2);p.lineTo(x-w/2,y+h/2);p.lineTo(x+w/2,y+h/2);p.lineTo(x+w/2,y-h/2);p.closePath();shape.holes.push(p);}
function clip131(poly,axis,bound,less){const out=[],side=p=>(less?1:-1)*(bound-p[axis]);for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],sa=side(a),sb=side(b);if(sa>=0)out.push(a);if((sa>=0)!==(sb>=0)){const t=sa/(sa-sb);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
function petalHole131(shape,a,inner,outer,width){
 const p=[];for(let i=0;i<=24;i++){const t=i/24,r=inner+(outer-inner)*Math.sin(Math.PI*t),angle=a+width*Math.sin(TAU*t);p.push([Math.sin(angle)*r*.171,Math.cos(angle)*r*.250]);}
 let clipped=p;for(const [axis,bound,less]of[[0,.183,true],[0,-.183,false],[1,.282,true],[1,-.282,false]])clipped=clip131(clipped,axis,bound,less);
 clipped=clipped.filter((p,i)=>!i||Math.hypot(p[0]-clipped[i-1][0],p[1]-clipped[i-1][1])>1e-8);if(clipped.length>2&&Math.hypot(clipped[0][0]-clipped.at(-1)[0],clipped[0][1]-clipped.at(-1)[1])<1e-8)clipped.pop();
 if(clipped.length<3)return;const path=new T.Path();clipped.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();shape.holes.push(path);
}
function floralScreen131(){
 const shape=new T.Shape();shape.moveTo(-.199,-.416);shape.lineTo(.199,-.416);shape.lineTo(.199,.416);shape.lineTo(-.199,.416);shape.closePath();circleHole131(shape,0,0,.014);
 for(let k=0;k<8;k++){petalHole131(shape,k*TAU/8,.14,.92,.24);petalHole131(shape,(k+.5)*TAU/8,.35,1.65,.22);}
 for(const sign of[-1,1])for(let k=0;k<4;k++)for(let row=0;row<2;row++)rectHole131(shape,(k-1.5)*.085,sign*(.321+row*.052),.061,.034);
 const g=new T.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:false,steps:1,curveSegments:24});g.name='hardware131-closed-pierced-six-face-floral-and-fret-screen';g.userData.holes=shape.holes.length;g.userData.openAreaRatio=shape.holes.reduce((s,h)=>s+Math.abs(T.ShapeUtils.area(h.getPoints(48))),0)/(.398*.832);return g;
}
function cornerPlate131(B,x,y,z,yaw=0){B.with(x,y,z,yaw,()=>{B.box(0,0,0,.07,.065,.009,'hardwareGold131');for(const sx of[-1,1])B.sphere(sx*.022,0,.007,.005,.005,.004,'hardwarePatina131');});}
function ceilingBearing131(B,x,z){
 const ray=new T.Ray(V([x,8.2,z]),V([0,1,0])),hits=[];
 for(const bucket of B.buckets.values())for(const item of bucket.items){if(item.role!=='foreground124-continuous-ceiling-load-path')continue;bucket.g.computeBoundingBox();const local=ray.clone().applyMatrix4(item.m.clone().invert()),hit=local.intersectBox(bucket.g.boundingBox,new T.Vector3());if(hit){hit.applyMatrix4(item.m);if(hit.y>8.2)hits.push(hit.y);}}
 if(!hits.length)throw Error('Hardware131 lantern has no actual ceiling bearing');return Math.min(...hits);
}

export function buildForegroundLantern131(B){
 const L=hardware131.lantern,screen=floralScreen131(),mountY=ceilingBearing131(B,L.position[0],L.position[2]),worldEyeY=L.position[1]+1.34*L.scale;
 B.label('hardware131-hexagonal-wood-metal-openwork-lantern',()=>B.with(...L.position,L.yaw,()=>{
  const R=L.bodyRadius,apothem=R*Math.cos(Math.PI/6),bottom=L.bodyBottom,top=L.bodyTop;
  // Each face is a pierced metal casting in an assembled wooden hexagon.
  for(let k=0;k<6;k++)B.with(0,0,0,k*TAU/6,()=>{
   B.box(0,-.038,apothem-.027,.399,.832,.009,'hardwarePaper131');B.emit(screen,'hardwareBronze131',0,-.038,apothem+.004);
   for(const y of[bottom-.012,top+.015]){B.box(0,y,apothem,R+.031,.059,.052,'hardwareWood131');B.box(0,y,apothem+.030,R+.035,.012,.010,'hardwareGold131');}
   for(const x of[-R/2,R/2]){B.box(x,-.04,apothem,.044,.96,.051,'hardwareWood131');B.box(x,-.04,apothem+.029,.011,.87,.009,'hardwareGold131');cornerPlate131(B,x,top-.03,apothem+.035);cornerPlate131(B,x,bottom+.025,apothem+.035);}
   // Geometric head and sill friezes remain part of each window frame.
   for(const y of[-.452,.375])for(let j=0;j<5;j++)B.with((j-2)*.070,y,apothem+.039,0,()=>B.box(0,0,0,.032,.032,.009,'hardwareGold131',[0,0,Math.PI/4]));
  });
  // Sharp six-sided eaves, curved corner ridges and a separate stepped crown.
  const roof=loft131([[.64,.48],[.64,.525],[.58,.55],[.49,.57],[.39,.645],[.29,.695]],6,'hardware131-closed-six-hip-stepped-crown',{polygon:true});B.emit(roof,'hardwareBronze131');
  for(const [r,y,h]of[[.644,.49,.035],[.592,.544,.020],[.302,.716,.045]])B.emit(loft131([[r,y-h/2],[r,y+h/2]],6,'hardware131-hexagonal-bevelled-eave-moulding',{polygon:true}),'hardwareGold131');
  for(let k=0;k<6;k++){
   const angle=(k+.5)*TAU/6,s=Math.sin(angle),c=Math.cos(angle);
   B.tube([[s*.36,.665,c*.36],[s*.49,.582,c*.49],[s*.61,.552,c*.61],[s*.644,.573,c*.644],[s*.645,.606,c*.645]],.011,'hardwareGold131',24,8);B.sphere(s*.645,.612,c*.645,.014,.018,.014,'hardwareBronze131');
   B.with(0,0,0,k*TAU/6,()=>{const z=.64*Math.cos(Math.PI/6)+.012;for(let j=0;j<9;j++){const x=(j-4)*.063;B.box(x,.505,z,.031,.025,.008,'hardwarePatina131');}});
  }
  B.emit(loft131([[.29,.735],[.29,.77],[.23,.79],[.17,.815],[.14,.86],[.16,.89],[.235,.94],[.235,1.01],[.18,1.055],[.115,1.08],[.105,1.13],[.13,1.17],[.105,1.21],[.045,1.24]],64,'hardware131-closed-crown-upper-lotus-knob'),'hardwareBronze131');
  for(const [r,y,h]of[[.285,.774,.021],[.145,.865,.018],[.12,1.12,.018]])B.emit(loft131([[r,y-h/2],[r,y+h/2]],64,'hardware131-crown-retaining-collar'),'hardwareGold131');
  // Six-sided sill and pan: no circular drum under the rectangular windows.
  B.emit(loft131([[.47,-.49],[.50,-.525],[.56,-.545],[.56,-.586],[.46,-.625],[.35,-.65]],6,'hardware131-closed-hexagonal-lower-eave-pan',{polygon:true}),'hardwareBronze131');
  B.emit(loft131([[.565,-.553],[.565,-.574]],6,'hardware131-hexagonal-sill-gilt-edge',{polygon:true}),'hardwareGold131');
  for(let k=0;k<6;k++){const a=(k+.5)*TAU/6,x=Math.sin(a),z=Math.cos(a);B.between([x*.48,-.55,z*.48],[x*.54,-.66,z*.54],.021,.021,'hardwareGold131',true);torus131(B,x*.54,-.696,z*.54,.044,'hardwareBronze131',.82,1.05,a);B.sphere(x*.49,-.553,z*.49,.017,.017,.017,'hardwareGold131');}
  B.emit(loft131([[.26,-.651],[.25,-.69],[.18,-.715],[.11,-.73],[.07,-.78],[.065,-.86],[.037,-.88]],48,'hardware131-closed-lower-lotus-pendant-socket'),'hardwareGold131');
  B.cyl(0,-.92,0,.016,.12,'hardwareBronze131');torus131(B,0,-.964,0,.044,'hardwareBronze131',.82,1.20,0);
  for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5])B.sphere(Math.sin(a)*.043,-1.024,Math.cos(a)*.043,.026,.028,.026,'hardwareGold131');
  B.emit(loft131([[.018,-1.03],[.029,-1.065],[.026,-1.10],[.011,-1.125]],32,'hardware131-closed-pendant-terminal-bud'),'hardwareBronze131');
  B.box(0,1.272,0,.036,.064,.05,'hardwareGold131');torus131(B,0,1.337,0,.060,'hardwareBronze131',.86,1.07,0);
 },L.scale));
 B.label('hardware131-connected-ceiling-chain-and-fasteners',()=>{
  const x=L.position[0],z=L.position[2],bottom=worldEyeY+.035,length=mountY-.115-bottom,count=Math.max(2,Math.round(length/.075));
  for(let i=0;i<=count;i++){const y=bottom+length*i/count;torus131(B,x,y,z,.033,'hardwareBronze131',1,1.40,i%2*Math.PI/2);}
  B.box(x,mountY-.012,z,.15,.024,.13,'hardwareBronze131');for(const dx of[-.047,.047])for(const dz of[-.038,.038])B.sphere(x+dx,mountY-.027,z+dz,.009,.008,.009,'hardwareGold131');
  B.box(x,mountY-.029,z,.018,.022,.026,'hardwareGold131');torus131(B,x,mountY-.074,z,.025,'hardwareGold131',.8,1.15,count%2?0:Math.PI/2);
 });
 B.layout124??={};B.layout124.hardware131={...(B.layout124.hardware131??{}),lantern:{...L,screenHolesPerFace:screen.userData.holes,screenOpenAreaRatio:screen.userData.openAreaRatio,actualCeilingUndersideY:mountY,chainTopMountFaceY:mountY,chainBottomEyeY:worldEyeY}};
}

const finialProfile131=[[.76,0],[.80,.035],[.82,.105],[.78,.145],[.72,.18],[.72,.56],[.80,.585],[.82,.63],[.78,.69],[.62,.735],[.52,.78],[.50,.91],[.54,.95],[.55,1.035],[.49,1.10],[.45,1.145],[.41,1.20],[.40,1.30],[.51,1.42],[.59,1.57],[.62,1.74],[.62,1.90],[.59,2.035],[.49,2.15],[.32,2.25],[.15,2.32],[.10,2.40],[.075,2.52],[.025,2.63]];
function reliefBand131(){
 const p=[],ix=[],colors=[],N=320,H=32,inner=.72,low=.18,high=.56;
 const color0=new T.Color(0x5b3b14),color1=new T.Color(0xd0a85c),at=(shell,j,k)=>shell*(H+1)*N+j*N+(k+N)%N;
 for(let shell=0;shell<2;shell++)for(let j=0;j<=H;j++)for(let k=0;k<N;k++){
  const a=k/N*TAU,v=j/H,xx=((k/N*10)%1-.5)*2,yy=(v-.5)*2,angle=Math.atan2(yy,xx),rho=Math.hypot(xx,yy),petal=.52+.16*Math.cos(angle*6),flower=Math.exp(-Math.pow((rho-petal)/.095,2)),scroll=Math.exp(-Math.pow((yy-.52*Math.sin(xx*Math.PI))/.11,2)),edge=Math.pow(Math.sin(v*Math.PI),.40),relief=Math.max(flower,scroll*.7)*edge,r=shell===0?inner:.755+.047*relief;
  p.push(Math.sin(a)*r,low+(high-low)*v,Math.cos(a)*r);const c=color0.clone().lerp(color1,.16+.84*relief);colors.push(c.r,c.g,c.b);
 }
 for(let s=0;s<2;s++)for(let j=0;j<H;j++)for(let k=0;k<N;k++){const a=at(s,j,k),b=at(s,j,k+1),c=at(s,j+1,k),d=at(s,j+1,k+1);s?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
 for(const j of[0,H])for(let k=0;k<N;k++){const a=at(0,j,k),b=at(0,j,k+1),c=at(1,j,k),d=at(1,j,k+1);j?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
 return indexedSolid131(p,ix,'hardware131-closed-annular-cast-scroll-and-flower-relief',colors);
}
let finialCore131,finialBand131;
export function buildBalustradeFinial131(B,p,r,yaw,postWidth=r>.15?.34:.19){
 finialCore131??=loft131(finialProfile131,128,'hardware131-closed-fluted-lotus-giboshi-core',{flute:true});finialBand131??=reliefBand131();
 B.label('hardware131-carved-bronze-balustrade-caps',()=>B.with(p.x,p.y,p.z,yaw,()=>{
  B.emit(finialCore131,'hardwareFinial131');B.emit(finialBand131,'hardwareRelief131');
  // Thin upper/lower compression ledges are integral seating interfaces; the
  // characteristic change is the sculpted body and relief drum between them.
  for(const [radius,y,h]of[[.81,.082,.035],[.79,.592,.025],[.80,.644,.027],[.54,.957,.016],[.52,1.045,.016]])B.emit(loft131([[radius,y-h/2],[radius,y+h/2]],96,'hardware131-finial-machined-retaining-ledge'),'hardwareGold131');
  for(let k=0;k<12;k++){const a=k/12*TAU;B.sphere(Math.sin(a)*.805,.106,Math.cos(a)*.805,.025,.025,.022,'hardwareGold131',a);}
 },[postWidth*1.02/(2*.82),r,postWidth*1.02/(2*.82)]));
 B.layout124??={};B.layout124.hardware131={...(B.layout124.hardware131??{}),finial:{...hardware131.finial,allCapsUseSharedAssembly:true,seatDiameterMatchesWoodPostWidth:1.02,woodPostHeadY:p.y}};
}
