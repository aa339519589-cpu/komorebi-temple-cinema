import {createSculptedTimber109} from './scene03-sculpted-timber109.js';

export function buildEnclosure109(T,{C,emit,box,grouped,role,mats,materials,keep,tube,addLight}){
 const carving=createSculptedTimber109(T,keep),material=(key,color,roughness,metalness=0)=>{const m=new T.MeshStandardMaterial({name:'scene03-'+key,color,roughness,metalness});mats[key]=m;materials.push(m);return key;};
 const warmPaper=material('warm-recessed-window-paper109','#b99b69',.96),shadowPaper=material('shadow-window-inner-wood109','#5c3f23',.85),windowBronze=material('aged-window-metal109','#9c7a3c',.62,.68),blackReveal=material('black-lacquer-portal-reveal109','#23190f',.68);
 role('hall-deep-window-enclosure109',()=>{
  box(0,5.65,-8.65,14.2,6.9,.26,'darkwood');
  for(const s of[-1,1]){
   box(s*7.02,5.65,-4.5,.30,6.9,8.4,'darkwood');
   for(let j=0;j<6;j++){box(s*6.88,6.35,-1.4-j*1.25,.22,3.4,.12,'cedar');box(s*6.84,7.85,-1.4-j*1.25,.18,.18,1.2,'oldgold');}
  }
  for(const s of[-1,1])for(const [index,seg]of[[0,[3.0,4.55]],[1,[4.95,6.7]]]){
   const cx=s*(seg[0]+seg[1])/2,w=seg[1]-seg[0],h=3.42,bottom=C.stairTopY+.27,y=bottom+h/2,front=-.18,back=-1.58;
   // Returned reveals, sill and inner ceiling supply an actual1.4m recess.
   for(const sign of[-1,1])box(cx+sign*(w/2-.065),y,(front+back)/2,.13,h,front-back,'cedar');
   for(const sign of[-1,1])box(cx,y+sign*(h/2-.085),(front+back)/2,w,.17,front-back,'red');
   box(cx,y,back-.02,w-.16,h-.22,.10,warmPaper);
   box(cx,bottom+.16,back+.18,w-.14,.20,.30,shadowPaper);
   for(let j=0;j<5;j++)box(cx-w*.39+j*w*.195,y,back+.07,.055,h-.24,.065,shadowPaper);
   // Two thick timber lattice leaves stand on separate hinge/rebate planes.
   for(const half of[-1,1])grouped(cx+half*w*.235,y,front+.03,half*.055,()=>{
    const ww=w*.47;for(const sign of[-1,1]){box(sign*(ww/2-.035),0,0,.075,h-.10,.13,'darkwood');box(0,sign*(h/2-.075),0,ww,.10,.14,'cedar');}
    for(let j=1;j<5;j++)box(-ww/2+j*ww/5,0,-.018,.036,h-.20,.086,'cedar');
    for(let j=1;j<11;j++)box(0,-h/2+j*h/11,-.003,ww-.09,.030,.090,'cedar');
    for(const yy of[-h*.25,h*.25])box(half*ww*.42,yy,.069,.055,.13,.018,windowBronze);
   });
   if(index===0){
    const lamp=new T.PointLight('#ffcd8c',2.2,1.85,2);lamp.name='scene03-contained-window-lamp109';lamp.castShadow=true;lamp.shadow.mapSize.set(256,256);lamp.shadow.camera.near=.05;lamp.shadow.camera.far=1.85;lamp.shadow.bias=-.0002;addLight(lamp,[cx,y+.25,-.98]);
    emit(keep(new T.SphereGeometry(1,16,10)),windowBronze,cx,y+.29,-1.01,.085,.15,.085);
   }
  }
 });
 role('hall-deep-carved-portal109',()=>{
  const clearW=4.2,clearH=C.portalHeight,y0=C.stairTopY,z=-.62;
  for(const s of[-1,1]){
   box(s*(clearW/2+.30),y0+clearH/2,z,.60,clearH,1.0,'cedar');
   box(s*(clearW/2+.028),y0+clearH/2,z,.055,clearH,.96,blackReveal);
   for(const xx of[clearW/2+.055,clearW/2+.565])box(s*xx,y0+clearH/2,-.098,.032,clearH,.035,'oldgold');
   for(let j=0;j<5;j++)emit(carving.scrollFace(j%3),'endwood',s*(clearW/2+.30),y0+clearH*(j+.5)/5,-.04,.40,clearH*.165,.25);
   tube([[s*(clearW/2+.30),y0+.12,.007],[s*(clearW/2+.34),y0+clearH*.32,.026],[s*(clearW/2+.26),y0+clearH*.63,.022],[s*(clearW/2+.30),y0+clearH-.12,.007]],.013,'oldgold',40);
  }
  box(0,y0+clearH+.28,z,5.42,.56,1.0,'cedar');
  for(const sign of[-1,1])box(0,y0+clearH+.28+sign*.25,-.098,5.30,.035,.035,'oldgold');
  for(let j=-2;j<=2;j++)emit(carving.scrollFace((j+3)%3),'endwood',j*.97,y0+clearH+.28,-.04,.88,.41,.25);
  for(let j=0;j<8;j++)box(0,y0+clearH+.045,-.30-j*.18,4.22,.09,.115,'darkwood');
  for(const s of[-1,1])box(s*1.98,y0+clearH+.06,-.94,.15,.12,1.5,'red');
  box(0,y0+.026,-.68,4.20,.052,1.16,'darkwood');
  // Portal clear aperture, stair top and room floor are retained. The two
  // existing carved ranma beams become much deeper lapped structural heads.
  for(const y of[C.capitalTop-.40,C.capitalTop+.20])box(0,y,.06,6.15,.46,.74,'red');
  emit(carving.frogStrut(),'cedar',0,C.capitalTop+.06,.08,1.53,.91,.92);
  for(const sign of[-1,1])tube([[sign*1.57,C.capitalTop+.24,.28],[sign*1.02,C.capitalTop+.37,.29],[sign*.77,C.capitalTop+.77,.30],[0,C.capitalTop+1.03,.28]],.018,'oldgold',36);
  for(const s of[-1,1])for(const span of[[2.86,4.73,C.capitalTop-.9],[4.73,6.88,C.capitalTop-1.3]]){
   const x=s*(span[0]+span[1])/2,w=span[1]-span[0];box(x,span[2]+.12,.04,w,.43,.62,'red');emit(carving.scrollFace(2),'endwood',x,span[2]+.12,.385,w*.86,.31,.22);
  }
 });
 return{revision:109,windowRecessMetres:1.40,portalClear:[4.2,C.portalHeight],portalJambSection:[.60,1.0],mainHeadSection:[.46,.74],imageProjection:false};
}
