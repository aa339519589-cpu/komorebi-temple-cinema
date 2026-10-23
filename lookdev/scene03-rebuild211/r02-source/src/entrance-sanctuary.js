import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {restoredBuddhaParts,RESTORED_BUDDHA_METRICS} from './scene03-sanctuary-buddha.js';

// A local shrine behind the retained entrance, not a luminous panel. The
// reused sculpture is independent authored 3D anatomy; the reference03 photo
// constrains placement/visible scale, not the unseen historic iconography.
export function createEntranceSanctuary(T,architecture){
 const C=architecture.config,floor=C.stairTopY,root=new T.Group();root.name='scene03-recessed-entry-sanctuary';
 root.matrixAutoUpdate=false;root.matrix.makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(C.hallYaw??.12)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 const geos=new Set(),materials=new Set(),parts=[];
 const own=g=>{geos.add(g);return g;};
 const mat=(name,color,roughness,metalness=0)=>{const m=new T.MeshStandardMaterial({name,color,roughness,metalness});materials.add(m);return m;};
 const timber=mat('scene03-shrine-deep-cedar','#382719',.83),lacquer=mat('scene03-shrine-black-brown-lacquer','#1d140c',.55),endgrain=mat('scene03-shrine-worn-wood-edges','#65452a',.76);
 const gilt=mat('scene03-shrine-aged-gilt','#c3a363',.42,.83),oldgold=mat('scene03-shrine-dark-gilt-recess','#74532b',.58,.72),body=mat('scene03-shrine-main-icon-gilt','#c3a05a',.40,.80),face=mat('scene03-shrine-icon-face','#caa866',.40,.76),crease=mat('scene03-shrine-icon-deep-cast-fold','#5b3b16',.64,.70),wax=mat('scene03-shrine-candle-wax','#e1ceb0',.82);
 const normal=architecture.materials.darkwood.normalMap;
 for(const m of[timber,lacquer,endgrain]){m.normalMap=normal;m.normalScale.set(.15,.15);}
 function mesh(g,m,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0],name='shrine-solid'){
  const object=new T.Mesh(g,m);object.position.fromArray(p);object.scale.fromArray(scale);object.rotation.set(...rotation);object.name=name;object.castShadow=object.receiveShadow=true;root.add(object);parts.push(object);return object;
 }
 function metricUV(g){const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],axis=nn.indexOf(Math.max(...nn));uv[i*2]=axis===0?p.getZ(i):p.getX(i);uv[i*2+1]=axis===1?p.getZ(i):p.getY(i);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}
 function box(name,p,size,m,bevel=.008){return mesh(own(metricUV(new RoundedBoxGeometry(...size,2,bevel))),m,p,[1,1,1],[0,0,0],name);}
 function turned(name,profile,p,m,sz=1){const g=own(new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),48));return mesh(g,m,p,[1,1,sz],[0,0,0],name);}

 // Actual floor joints and short return walls give the icon a room behind
 // the portal. The prior distant hall wall remains outside this inner shrine.
 for(let i=0;i<12;i++)box('shrine-individual-floorboard-'+i,[-2.16+(i+.5)*.36,floor+.027,-3.02],[.355,.054,4.15],i%3===0?endgrain:timber,.003);
 for(const s of[-1,1]){
  box('shrine-recess-return-'+s,[s*2.22,floor+2.06,-3.07],[.12,4.12,4.02],timber,.005);
  box('shrine-return-foot-rail-'+s,[s*2.145,floor+.18,-3.07],[.055,.16,4.02],lacquer,.005);
  box('shrine-return-cap-rail-'+s,[s*2.145,floor+3.80,-3.07],[.055,.12,4.02],endgrain,.005);
 }
 box('shrine-real-rear-wall',[0,floor+2.06,-5.08],[4.5,4.12,.16],timber,.005);
 for(let i=0;i<9;i++)box('shrine-rear-vertical-joint-'+i,[-2.18+i*.545,floor+2.06,-4.985],[.022,4.0,.035],lacquer,.002);
 box('shrine-ceiling-return',[0,floor+4.12,-3.07],[4.5,.12,4.12],timber,.006);
 for(const m of[body,face,crease])m.envMapIntensity=.18;
 const iconX=-.18,iconZ=-4.20,seat=floor+.85,iconScale=.52;

 // A compressed stepped pedestal actually reaches the floor. Nothing floats
 // behind a black door or is pasted onto a luminous gold rectangle.
 box('shrine-plinth-low',[iconX,floor+.11,iconZ],[2.40,.18,1.65],lacquer,.018);
 box('shrine-plinth-low-gilt-lip',[iconX,floor+.225,iconZ],[2.45,.05,1.70],gilt,.006);
 box('shrine-plinth-timber-core',[iconX,floor+.39,iconZ],[2.15,.28,1.43],lacquer,.014);
 box('shrine-plinth-upper-gilt-moulding',[iconX,floor+.56,iconZ],[2.26,.07,1.52],gilt,.012);
 turned('shrine-closed-lotus-seat-core',[[0,0],[.76,0],[.98,.045],[1.02,.11],[.94,.20],[.84,.245],[0,.245]],[iconX,floor+.605,iconZ],oldgold,.72);
 const petal=new T.Shape();petal.moveTo(-.12,0);petal.bezierCurveTo(-.17,.05,-.17,.14,-.065,.205);petal.quadraticCurveTo(-.018,.235,0,.267);petal.quadraticCurveTo(.018,.235,.065,.205);petal.bezierCurveTo(.17,.14,.17,.05,.12,0);petal.quadraticCurveTo(0,-.028,-.12,0);
 const petalG=own(new T.ExtrudeGeometry(petal,{depth:.034,steps:1,curveSegments:10,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}));
 for(let row=0;row<2;row++)for(let j=0;j<24;j++){const a=(j+(row?.5:0))*Math.PI/12,r=row?.92:1.00;mesh(petalG,row?gilt:oldgold,[iconX+Math.sin(a)*r,floor+.575+row*.105,iconZ+Math.cos(a)*r*.72],[1,.82,1],[0,a,0],'shrine-closed-lotus-petal');}
 turned('shrine-seat-upper-contact',[[0,0],[.81,0],[.85,.022],[.82,.055],[0,.055]],[iconX,seat-.05,iconZ],gilt,.72);

 const sculptureMaterials={buddha:body,oldgold,gold:gilt,crease,face,hand:body,cloth:body};
 for(const part of restoredBuddhaParts('central')){
  geos.add(part.geometry);mesh(part.geometry,sculptureMaterials[part.material],[iconX,seat,iconZ],[iconScale,iconScale,iconScale],[0,0,0],'shrine-complete-icon-'+part.material);
 }

 // Thick posts and a pierced arch are behind the statue. Their negative
 // opening is real; they do not replace the interior with a gold screen.
 for(const s of[-1,1]){
  box('shrine-inner-post-'+s,[iconX+s*1.40,floor+1.80,-4.56],[.16,3.48,.18],lacquer,.012);
  for(const y of[floor+.25,floor+3.34])box('shrine-inner-post-gilt-cap',[iconX+s*1.40,y,-4.445],[.20,.11,.055],gilt,.008);
 }
 const arch=new T.Shape();arch.moveTo(-1.52,0);arch.lineTo(-1.52,.19);arch.bezierCurveTo(-.94,.18,-.82,.57,0,.72);arch.bezierCurveTo(.82,.57,.94,.18,1.52,.19);arch.lineTo(1.52,0);arch.bezierCurveTo(.90,.01,.68,.36,0,.49);arch.bezierCurveTo(-.68,.36,-.90,.01,-1.52,0);
 const archG=own(new T.ExtrudeGeometry(arch,{depth:.16,steps:1,curveSegments:20,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}));mesh(archG,oldgold,[iconX,floor+3.32,-4.62],[1,1,1],[0,0,0],'shrine-thick-open-cusped-arch');

 // Separate offering table, legs, pierced apron and small turned vessels.
 const tableX=0,tableZ=-1.85,tableTop=floor+.67;
 box('shrine-offering-table-top',[tableX,tableTop-.045,tableZ],[2.12,.09,.70],lacquer,.014);
 box('shrine-offering-table-worn-lip',[tableX,tableTop+.007,tableZ],[2.16,.018,.72],oldgold,.005);
 for(const sx of[-1,1])for(const sz of[-1,1])box('shrine-table-supported-leg',[tableX+sx*.86,floor+.315,tableZ+sz*.235],[.13,.57,.13],lacquer,.010);
 const apron=new T.Shape();apron.moveTo(-.95,.0);apron.lineTo(.95,0);apron.lineTo(.95,-.20);apron.bezierCurveTo(.72,-.19,.55,-.055,.37,-.07);apron.quadraticCurveTo(0,-.27,-.37,-.07);apron.bezierCurveTo(-.55,-.055,-.72,-.19,-.95,-.20);apron.closePath();
 const apronG=own(new T.ExtrudeGeometry(apron,{depth:.055,steps:1,curveSegments:14,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}));mesh(apronG,lacquer,[tableX,tableTop-.08,tableZ+.29],[1,1,1],[0,0,0],'shrine-curved-solid-table-apron');
 for(const x of[-.85,.85]){
  turned('shrine-closed-candle-baluster',[[0,0],[.10,0],[.115,.025],[.075,.055],[.04,.09],[.032,.28],[.055,.34],[.12,.37],[.12,.39],[0,.39]],[x,tableTop+.018,tableZ-.03],oldgold);
  turned('shrine-real-wax-candle',[[0,0],[.028,0],[.028,.17],[.022,.18],[0,.175]],[x,tableTop+.41,tableZ-.03],wax);
  const flameMat=mat('scene03-small-physical-candle-flame','#f0bf60',.8);flameMat.emissive.set('#f3b35b');flameMat.emissiveIntensity=.8;
  mesh(own(new T.SphereGeometry(1,12,12)),flameMat,[x,tableTop+.62,tableZ-.03],[.012,.035,.012],[0,0,0],'shrine-small-candle-flame');
  const light=new T.PointLight('#ffd29c',1.0,3.2,2);light.position.set(x,tableTop+.64,tableZ-.03);light.name='shrine-one-candle-point-source';root.add(light);
 }
 const burnerY=tableTop+.025;
 turned('shrine-hollow-bronze-incense-burner',[[0,0],[.095,0],[.13,.05],[.18,.14],[.17,.22],[.15,.235],[.145,.215],[.155,.14],[.115,.07],[0,.045]],[tableX,burnerY,tableZ+.10],oldgold);
 for(const s of[-1,1])mesh(own(new T.TorusGeometry(.075,.012,10,32)),oldgold,[tableX+s*.185,burnerY+.16,tableZ+.10],[1,1,1],[0,Math.PI/2,0],'shrine-incense-burner-closed-handle');
 turned('shrine-small-offering-dish',[[0,0],[.065,0],[.07,.014],[.14,.035],[.145,.05],[.13,.056],[.065,.027],[0,.027]],[tableX+.37,tableTop+.022,tableZ+.13],gilt);

 architecture.group.add(root);root.updateMatrixWorld(true);
 let triangles=0;for(const object of parts){const g=object.geometry;triangles+=(g.index?.count??g.attributes.position.count)/3;}
 return {info:{scope:'One opened retained portal and a supported recessed inner shrine',floorY:floor,innerRoom:{width:4.44,frontZ:-1.06,backZ:-5.08},figure:{center:[iconX,seat,iconZ],scale:iconScale,crownY:seat+RESTORED_BUDDHA_METRICS.crownTop*iconScale,kneeWidth:RESTORED_BUDDHA_METRICS.kneeWidth*iconScale,fullAuthoredAnatomy:true,variant:'Reference06 central seated icon reused as an interpreted stand-in'},triangles,meshes:parts.length,visualAccepted:false},
  dispose(){architecture.group.remove(root);for(const g of geos)g.dispose();for(const m of materials)m.dispose();}};
}
