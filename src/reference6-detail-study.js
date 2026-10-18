import * as T from '../vendor/build/three.module.js';
import {mergeGeometries} from '../vendor/examples/jsm/utils/BufferGeometryUtils.js';

// Fine cast-gold detail on the existing reference6 pendant frames only.
// It adds real curved geometry; no reference pixels or billboards are loaded.
const states=new WeakMap();
export function buildPendantFiligreeGeometry({length=3.20,width=.78,rows=24}={}){
 if(!Number.isFinite(length)||length<=0||!Number.isFinite(width)||width<=0||!Number.isInteger(rows)||rows<8||rows>40)throw Error('Invalid bounded pendant detail parameters');
 const shapes=[],fieldScale=width/.53;
 const sphere=new T.SphereGeometry(1,10,6),matrix=new T.Matrix4(),q=new T.Quaternion(),zAxis=new T.Vector3(0,0,1);
 const addLeaf=(x,y,z,angle,w,h)=>{const g=sphere.clone();q.setFromAxisAngle(zAxis,angle);matrix.compose(new T.Vector3(x,y,z),q,new T.Vector3(w,h,.007));g.applyMatrix4(matrix);shapes.push(g);};
 const vineX=(y,side)=>side*(.156+.035*Math.sin(-y/length*Math.PI*8));
 for(const side of [-1,1])for(let row=0;row<rows;row++){
  const y=-.06-(length-.12)*(row+.5)/rows,x=vineX(y,side),cx=x-side*.056,cy=y+.009;
  const points=[new T.Vector3(x,y,.073)];
  for(let k=0;k<=32;k++){
   const t=k/32,a=t*Math.PI*1.76,r=.057*(1-.82*t);
   points.push(new T.Vector3(cx+side*r*Math.cos(a),cy+r*Math.sin(a),.076+.005*Math.sin(t*Math.PI)));
  }
  shapes.push(new T.TubeGeometry(new T.CatmullRomCurve3(points,false,'centripetal'),40,.0043,7,false));
  // Raised lancet leaves meet the same bearing vine and expose smooth metal
  // normals to the real window/practical lights instead of painted highlights.
  addLeaf(x-side*.011,y-.028,.078,side*.65,.0125,.046);
  addLeaf(x+side*.017,y+.020,.078,-side*.73,.0105,.036);
  const dot=sphere.clone();dot.scale(.007,.007,.005);dot.translate(cx,cy,.079);shapes.push(dot);
 }
 // Fine beads belong to the retained outer frame, inside its original bounds.
 for(const side of [-1,1])for(let i=0;i<=Math.floor(length/.046);i++){
  const y=-.022-(length-.044)*i/Math.floor(length/.046),g=sphere.clone();g.scale(.005,.005,.004);g.translate(side*.239,y,.075);shapes.push(g);
 }
 sphere.dispose();
 const geometry=mergeGeometries(shapes,false);shapes.forEach(g=>g.dispose());
 geometry.scale(fieldScale,1,1);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.name='reference6-fine-cast-pendant-filigree';
 geometry.userData={policy:'Added fine cast-metal scrolls, lancet leaves and frame beads; retained four major flower motifs and original pendant outline',rows,triangles:geometry.index.count/3};
 return geometry;
}
export function applyReference6DetailStudy(temple,enabled=true){
 if(typeof enabled!=='boolean')throw Error('Detail enable must be explicit');
 if(temple.info().lightingMode!=='sanctuary')throw Error('Reference6 detail requires the sanctuary mode');
 let state=states.get(temple);
 if(!state){
  const owner=temple.scene.getObjectByName('restoration-reference6-side-pendants');
  if(!owner)throw Error('Original reference6 pendant root is missing');
  const materials=new Set();owner.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='restoration-private-room-gold')materials.add(m);});
  if(materials.size!==1)throw Error('Require the one existing privately owned pendant gold material');
  const material=[...materials][0],geometry=buildPendantFiligreeGeometry(),group=new T.Group();group.name='reference6-fine-filigree-study';
  for(const side of [-1,1]){const mesh=new T.Mesh(geometry,material);mesh.position.set(side*4.15,6.30,2.00);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
  owner.add(group);state={owner,group,geometry};states.set(temple,state);
 }
 state.group.visible=enabled;
 temple.renderer.shadowMap.needsUpdate=true;temple.scene.traverse(o=>{if(o.isLight&&o.castShadow&&o.shadow)o.shadow.needsUpdate=true;});
 const receipt={enabled,owner:state.owner.name,addedMeshes:enabled?2:0,addedTriangles:enabled?state.geometry.index.count/3*2:0,localBounds:state.geometry.boundingBox.min.toArray().concat(state.geometry.boundingBox.max.toArray()),originalGeometryChanged:false,originalMaterialsChanged:false,reference:'canonical reference 6',acceptance:'Fine-detail visual study; not a pixel-exact ornament recovery'};
 temple.reference6DetailInfo=()=>receipt;return receipt;
}
export function disposeReference6DetailStudy(temple){const state=states.get(temple);if(!state)return;state.group.removeFromParent();state.geometry.dispose();states.delete(temple);}
