/** Reference-six R14 cast-metal depth pass. Actual triangles, real cast shadows.
 * Additive to the preserved independent v13 room, never a projected picture.
 */
import * as T from '../../../vendor/build/three.module.js';
const PART_NAME='reference6-r14-ceiling-and-banner-cast-relief';
function finite(g){
 const a=g.getAttribute('position');
 if(!a||!a.count)throw Error('Empty actual R14 geometry');
 for(let i=0;i<a.array.length;i++)if(!Number.isFinite(a.array[i]))throw Error('Invalid R14 position');
 g.computeBoundingSphere();return g;
}
export function addReference6DecorativeDepth(room,{enabled=true}={}){
 if(!room?.scene?.isScene||!room.materials?.gold||!room.hanging)throw Error('Exact independent reference6-v13 scene required');
 const scene=room.scene;
 if(scene.getObjectByName(PART_NAME))throw Error('R14 depth already installed');
 const root=new T.Group();root.name=PART_NAME;
 root.userData.source='Procedural 3D metal scrolls/threads, no photographic plane, no raster paint';
 scene.add(root);
 const originalCount={objects:0,triangles:0};scene.traverse(o=>{if(o.isMesh){originalCount.objects++;originalCount.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)}});
 const gild=room.materials.gold.clone();gild.name='reference6-r14-cast-thread-gold';gild.roughness=.29;gild.metalness=.92;
 const aged=room.materials.oldgold.clone();aged.name='reference6-r14-relief-shadow-gold';aged.roughness=.40;
 const materials=[gild,aged];
 const cylinder=finite(new T.CylinderGeometry(.0055,.0065,1,6,1,true));
 const bead=finite(new T.SphereGeometry(.014,8,6));
 const ring=finite(new T.TorusGeometry(.036,.005,6,18));
 const curlPoints=[];
 for(let i=0;i<=32;i++){const f=i/32,a=f*Math.PI*3.2,rad=.077*(1-.70*f);curlPoints.push(new T.Vector3(Math.sin(a)*rad,.028+Math.cos(a)*rad,.012*f));}
 const scroll=finite(new T.TubeGeometry(new T.CatmullRomCurve3(curlPoints),42,.0065,5,false));
 const sh=new T.Shape();sh.moveTo(0,-.08);sh.bezierCurveTo(-.055,-.03,-.05,.05,0,.104);sh.bezierCurveTo(.05,.05,.055,-.03,0,-.08);sh.closePath();
 const leaf=finite(new T.ExtrudeGeometry(sh,{depth:.010,bevelEnabled:true,bevelSegments:2,bevelSize:.002,bevelThickness:.002,curveSegments:9}));
 const geometry=[cylinder,bead,ring,scroll,leaf];
 const matrices={threads:[],beads:[],rings:[],scrolls:[],leaves:[],shadowScrolls:[]};
 const dummy=new T.Object3D();
 function put(key,x,y,z,sx=1,sy=1,sz=1,rotation=0){
  dummy.position.set(x,y,z);dummy.rotation.set(0,0,rotation);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
  matrices[key].push(dummy.matrix.clone());
 }
 // Real strands anchored on the photograph-facing cross beams.
 // Each central cord is a connected shaft. Spherical cast links are true solids.
 for(const xBase of[-2.85,2.85]){
  for(let col=0;col<15;col++){
   const x=xBase+(col-7)*.167,yTop=7.06;
   const z=1.28+.14*Math.sin(col*.82);
   const length=.42+.32*(.5+.5*Math.cos(col*.76));
   put('threads',x,yTop-length/2,z,1,length,1);
   for(let k=0;k<6;k++)put('beads',x,yTop-length*(k+.35)/6,z,.74+((col+k)%3)*.15,.74+((col+k)%3)*.15,.74);
   put('rings',x,yTop-length,z,1.12,1.05,1);
  }
 }
 // Denser central gilded chandelier layers below the true ceiling.
 for(let col=0;col<23;col++){
  const x=(col-11)*.100,z=.06+.16*Math.cos(col*.39),top=6.98;
  const len=.77+.24*Math.cos(col*.52);
  put('threads',x,top-len/2,z,1,len,1);
  for(let row=0;row<9;row++){
   const t=(row+.3)/9;
   put('beads',x,top-len*t,z,.75+row%3*.22,.75+row%3*.22,.75+row%3*.20);
  }
  put('rings',x,top-len-.02,z,.74,.74,.74);
 }
 // Two original hanging scrolls span world x +-4.15, from y6.345 to3.145.
 // The new gilt scrolls occupy only the narrow existing open metal fields.
 const pendantX=4.15,pendantTop=6.345,pendantZ=-.3;
 for(const side of[-1,1]){
  for(let row=0;row<13;row++){
   const cy=pendantTop-.18-row*.218;
   for(const sign of[-1,1]){
    const x=side*pendantX+sign*.145,z=pendantZ+.085;
    put('scrolls',x,cy,z,sign*.78,.79,1,(row%2?-.18:.18)*sign);
    put('leaves',x+sign*.067,cy+.024,z+.017,.38,.37,.65,(row%3-1)*.23);
   }
   if(row%2===0)put('beads',side*pendantX,cy,pendantZ+.08,.95,.95,.8);
  }
  // An attached inner border of filigree reflects highlights obliquely.
  for(const sign of[-1,1])for(let i=0;i<45;i++){
   const y=pendantTop-.10-i*.067;
   put('beads',side*pendantX+sign*.275,y,pendantZ+.038,.42,.42,.42);
  }
  for(let row=0;row<10;row++){
   const cy=pendantTop-.12-row*.295;
   put('shadowScrolls',side*(pendantX+.014),cy,pendantZ+.055,.65,.64,.73,side*.12);
  }
 }
 let triangles=0,instances=0,meshes=0;
 function make(name,shape,material,matrix){
  if(!matrix.length)return;
  const obj=new T.InstancedMesh(shape,material,matrix.length);
  obj.name=name;obj.castShadow=true;obj.receiveShadow=true;obj.frustumCulled=false;
  matrix.forEach((m,i)=>obj.setMatrixAt(i,m));obj.instanceMatrix.needsUpdate=true;
  root.add(obj);meshes++;instances+=matrix.length;
  triangles+=(shape.index?.count??shape.attributes.position.count)/3*matrix.length;
 }
 make('r14-structural-beaded-chains',cylinder,gild,matrices.threads);
 make('r14-solid-cast-pearls',bead,gild,matrices.beads);
 make('r14-open-ceiling-festoons',ring,gild,matrices.rings);
 make('r14-pierced-banner-scrolls',scroll,gild,matrices.scrolls);
 make('r14-raised-banner-leaves',leaf,gild,matrices.leaves);
 make('r14-shadow-carved-spirals',scroll,aged,matrices.shadowScrolls);
 root.visible=Boolean(enabled);
 const audit=()=>({enabled:root.visible,sourceVersion:'reference6-foundation-v13',sourceObjects:originalCount.objects,sourceTriangles:originalCount.triangles,
  addMeshes:meshes,instances,addedTriangles:triangles,originalSceneGeometryChanged:false,usesRealShadowCasting:true,
  usesReferenceTexture:false,hasAlphaPhotoPlanes:false,anchors:{ceilingY:7.06,pendantTopY:pendantTop,pendantXZ:[pendantX,pendantZ]}});
 let gone=false;
 return{root,audit,setEnabled(v){root.visible=Boolean(v);return audit()},dispose(){
  if(gone)return;gone=true;root.removeFromParent();geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 }};
}
