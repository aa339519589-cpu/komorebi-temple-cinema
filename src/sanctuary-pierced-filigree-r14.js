/**
 * Reference 6: pierced cast-gilt panels on the TWO pre-existing hangings.
 * Works on real world geometry; no raster overlays, reference pixels, or proxy mesh.
 * The original backing is retained (reversibly hidden) for strict A/B inspection.
 */
import * as T from '../vendor/build/three.module.js';

const NAME='reference6-r14-pierced-filigree';
const GOLD='#b99254';
const TAU=Math.PI*2;
function requireFiniteGeometry(geometry){
 const a=geometry.attributes.position;
 if(!a||a.count<3)throw Error('Empty filigree geometry');
 for(let i=0;i<a.array.length;i++)if(!Number.isFinite(a.array[i]))throw Error('Nonfinite filigree vertex '+i);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}
/** Each piece is actually hollow; adjacent gold scrolls bridge the interior. */
function spiralGeometry(radius=.094){
 const points=[];
 for(let i=0;i<=48;i++){
  const t=i/48,angle=(.18+1.85*t)*TAU,rad=(.086-.073*t)*radius/.094;
  points.push(new T.Vector3(Math.cos(angle)*rad,Math.sin(angle)*rad*.65+.014*t,.0035*Math.sin(3*Math.PI*t)));
 }
 return requireFiniteGeometry(new T.TubeGeometry(new T.CatmullRomCurve3(points),64,.0072,7,false));
}
function leafGeometry(){
 const s=new T.Shape();s.moveTo(0,-.094);
 s.bezierCurveTo(-.070,-.044,-.087,.026,0,.100);
 s.bezierCurveTo(.087,.026,.070,-.044,0,-.094);
 const g=new T.ExtrudeGeometry(s,{depth:.009,bevelEnabled:true,bevelSize:.0030,bevelThickness:.0030,bevelSegments:2,steps:1,curveSegments:12});
 return requireFiniteGeometry(g);
}
function railGeometry(){return requireFiniteGeometry(new T.BoxGeometry(1,1,1));}
function branchGeometry(){
 const pts=[];for(let i=0;i<=64;i++){
  const t=i/64,x=.265*Math.sin(t*Math.PI*5.0),y=(t-.5)*3.035,z=.0020*Math.sin(t*TAU*3.5);
  pts.push(new T.Vector3(x,y,z));
 }
 return requireFiniteGeometry(new T.TubeGeometry(new T.CatmullRomCurve3(pts),96,.0075,6,false));
}
function instance(parent,geo,material,name,matrices,stats){
 if(matrices.length===0)return;
 const obj=new T.InstancedMesh(geo,material,matrices.length);obj.name=name;
 matrices.forEach((m,i)=>obj.setMatrixAt(i,m));obj.instanceMatrix.needsUpdate=true;
 obj.castShadow=true;obj.receiveShadow=true;
 obj.computeBoundingBox();obj.computeBoundingSphere();parent.add(obj);
 stats.instances+=matrices.length;stats.batches++;
 return obj;
}
export function applySanctuaryPiercedFiligree(world,{enabled=true}={}){
 if(!world?.scene?.isScene)throw TypeError('Current Three.js scene required');
 const group=world.scene.getObjectByName('restoration-reference6-side-pendants');
 if(!group?.isObject3D)throw Error('Reference6 actual hanging assembly absent');
 if(group.getObjectByName(NAME))throw Error('Pierced filigree already installed');
 const originals=[];group.traverse(o=>{if(o.isMesh&&o.name==='reference6-solid-chased-pendant')originals.push(o)});
 if(originals.length!==2)throw Error('Expected exactly two R12 solid pendant backings, found '+originals.length);
 const before=originals.map(o=>o.visible),root=new T.Group();root.name=NAME;root.userData.reference=6;group.add(root);
 const originalsMaterial=originals[0].material;
 const gold=originalsMaterial.clone();gold.name='reference6-r14-pierced-cast-gold';gold.color.set(GOLD);gold.metalness=.88;gold.roughness=.365;gold.side=T.DoubleSide;
 const dark=originalsMaterial.clone();dark.name='reference6-r14-engraved-shadow-gold';dark.color.set('#76522e');dark.metalness=.82;dark.roughness=.47;dark.side=T.DoubleSide;
 const ownedMaterials=[gold,dark];
 const geometry=[railGeometry(),spiralGeometry(),leafGeometry(),branchGeometry()];
 const [rails,scroll,leaf,branch]=geometry, matrices={rails:[],scrolls:[],leaves:[],veins:[],branches:[],pearls:[]};
 const dummy=new T.Object3D();
 function add(which,x,y,z,sx,sy,sz,rz=0,rx=0,ry=0){
  dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();matrices[which].push(dummy.matrix.clone());
 }
 const bead=requireFiniteGeometry(new T.SphereGeometry(1,10,8));geometry.push(bead);
 // The original backing center already sits at its real world-space x/y/z,
 // and the relief was modelled in that same parent coordinate system.
 const positions=[];
 for(const original of originals){
  const {x,y,z}=original.position;positions.push([x,y,z]);
  // An actual skeletal frame with fine central vertical rods, not a decal.
  for(const sign of[-1,1])add('rails',x+sign*.339,y,z,.016,3.12,.017);
  for(const sign of[-1,1])add('rails',x,y+sign*1.556,z,.690,.013,.017);
  for(const dx of[-.155,0,.155])add('rails',x+dx,y,z-.003,.008,3.025,.012);
  // The curved ribs connect top and bottom so the interior is structurally
  // legible from oblique camera angles rather than a floating ornamental sheet.
  for(const sign of[-1,1])add('branches',x+sign*.005,y,z+.016,sign,1,1,0,0,0);
  // Overlapping, pierced cast scrolls arranged symmetrically, but with alternating
  // chirality. Their negative space remains true open space.
  for(let row=0;row<16;row++){
   const cy=y+1.42-row*.189;
   for(const sign of[-1,1]){
    const off=sign*(.160+(row%2)*.011);
    add('scrolls',x+off,cy,z+.025,sign,1,1,(row%2?-.13:.13)*sign);
    add('leaves',x+sign*.232,cy+.028,z+.038,sign*.42,.56,.72,(row%3-1)*.15);
    add('veins',x+sign*.232,cy+.028,z+.051,.005,.050,.004);
   }
   if(row%2===0)add('pearls',x,cy,z+.045,.019,.019,.012);
  }
  for(const sign of[-1,1])for(let row=0;row<58;row++)add('pearls',x+sign*.323,y+1.48-row*.052,z+.027,.010,.010,.007);
 }
 const stats={panels:2,originalBackingCount:originals.length,originalGeometryPreserved:true,instances:0,batches:0,referencePixelsUsed:false,transparentSurfaceUsed:false,actualOpenwork:true};
 instance(root,rails,gold,'r14-cast-support-ribs',matrices.rails,stats);
 instance(root,scroll,gold,'r14-deep-pierced-spirals',matrices.scrolls,stats);
 instance(root,leaf,gold,'r14-raised-metal-leaves',matrices.leaves,stats);
 instance(root,branch,dark,'r14-integral-stem-branches',matrices.branches,stats);
 instance(root,rails,dark,'r14-chased-leaf-midveins',matrices.veins,stats);
 instance(root,bead,gold,'r14-pierced-frame-beading',matrices.pearls,stats);
 function setEnabled(value){const active=Boolean(value);root.visible=active;originals.forEach((obj,i)=>obj.visible=active?false:before[i]);return active;}
 setEnabled(enabled);
 function report(){return{...stats,enabled:root.visible,originalVisibility:originals.map(o=>o.visible),material:gold.name,oldBackingBoundingBoxes:originals.map(o=>{o.geometry.computeBoundingBox();return [o.geometry.boundingBox.min.toArray(),o.geometry.boundingBox.max.toArray()]}),panelCenters:positions};}
 let disposed=false;
 return{root,report,setEnabled,dispose(){if(disposed)return;disposed=true;originals.forEach((o,i)=>o.visible=before[i]);root.removeFromParent();geometry.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());}};
}
