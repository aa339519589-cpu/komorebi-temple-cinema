import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {restorationReference10ThresholdPlan as defaultPlan} from './restoration-reference10-threshold-plan.js';

const EPS=1e-9;
const signedArea=poly=>poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a[0]*b[1]-a[1]*b[0];},0)/2;
function clean(poly){const out=[];for(const p of poly)if(!out.length||Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])>1e-7)out.push(p);if(out.length>2&&Math.hypot(out[0][0]-out.at(-1)[0],out[0][1]-out.at(-1)[1])<1e-7)out.pop();return out.length>=3&&Math.abs(signedArea(out))>1e-9?out:[];}
function halfPlane(poly,a,b,inside){const out=[],cross=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=cross(p),dq=cross(q),ip=inside?dp>=-EPS:dp<=EPS,iq=inside?dq>=-EPS:dq<=EPS;if(ip)out.push(p);if(ip!==iq){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return clean(out);}
function subtractConvex(poly,clip){let remainder=poly;const result=[];for(let i=0;i<clip.length&&remainder.length;i++){const a=clip[i],b=clip[(i+1)%clip.length],outside=halfPlane(remainder,a,b,false);if(outside.length)result.push(outside);remainder=halfPlane(remainder,a,b,true);}return result;}
function convexIntersection(poly,clip){let p=poly;for(let i=0;i<clip.length&&p.length;i++)p=halfPlane(p,clip[i],clip[(i+1)%clip.length],true);return p;}
function extent(poly){return {minX:Math.min(...poly.map(p=>p[0])),maxX:Math.max(...poly.map(p=>p[0])),minZ:Math.min(...poly.map(p=>p[1])),maxZ:Math.max(...poly.map(p=>p[1]))};}
const overlaps=(a,b)=>a.minX<b.maxX&&a.maxX>b.minX&&a.minZ<b.maxZ&&a.maxZ>b.minZ;
const key=p=>p.map(v=>Math.round(v*1e8)).join(',');
function boundaryDistance(p,poly){let best=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz));}return best;}
function extrusion(polygons,bottom,topAt){
  // Subtraction partitions are only a triangulation aid. Split shared edges at
  // every incident vertex, cancel internal edges, and emit NO internal walls.
  const vertices=[...new Map(polygons.flat().map(p=>[key(p),p])).values()];
  const polys=polygons.map(poly=>poly.flatMap((a,i)=>{const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,points=[{p:a,t:0}];for(const p of vertices){const t=((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l;if(t>1e-7&&t<1-1e-7&&Math.abs(dx*(p[1]-a[1])-dz*(p[0]-a[0]))<1e-8*Math.sqrt(l))points.push({p,t});}return points.sort((a,b)=>a.t-b.t).map(v=>v.p);}));
  const edges=new Map();for(const poly of polys)for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ka=key(a),kb=key(b),k=ka<kb?ka+'|'+kb:kb+'|'+ka;if(!edges.has(k))edges.set(k,{a,b,count:0});edges.get(k).count++;}
  const positions=[],uv=[];
  function tri(a,b,c){const u=new T.Vector3().fromArray(b).sub(new T.Vector3().fromArray(a)),v=new T.Vector3().fromArray(c).sub(new T.Vector3().fromArray(a));if(u.cross(v).lengthSq()<1e-19)return;positions.push(...a,...b,...c);for(const p of[a,b,c])uv.push(p[0],p[2]);}
  const pt=(p,y)=>[p[0],y,p[1]];
  for(const poly of polys){const centre=poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]);for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];tri(pt(centre,topAt(centre)),pt(b,topAt(b)),pt(a,topAt(a)));tri(pt(centre,bottom),pt(a,bottom),pt(b,bottom));}}
  for(const {a,b,count}of edges.values())if(count===1){const at=pt(a,topAt(a)),bt=pt(b,topAt(b)),ab=pt(a,bottom),bb=pt(b,bottom);tri(at,bt,bb);tri(at,bb,ab);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingBox();g.userData.internalPartitionWalls=0;return g;
}
function makeGrain(){const size=128,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const h=Math.sin(x*127.1+y*311.7)*43758.5453,n=h-Math.floor(h),v=Math.round(118+24*n+6*Math.sin(x*.21)*Math.cos(y*.18)),i=(y*size+x)*4;data[i]=v;data[i+1]=v+2;data[i+2]=v;data[i+3]=255;}const map=new T.DataTexture(data,size,size);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(1.5,1.5);map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;}

/** Real .060m flagstones, cut around the same 32-sided original column bases.
 * All coordinates are world metres. No old source, random stream, reflector,
 * light, camera, architecture or foundation is mutated or created here.
 */
export function buildRestorationReference10ThresholdSurface({materials={},options={}}={}){
  const plan=options.plan??defaultPlan,b=plan.bounds,ox=(b.minX+b.maxX)/2,oz=(b.minZ+b.maxZ)/2;
  const group=new T.Group();group.name='reference10-conditional-cut-stone-threshold';group.position.set(ox,0,oz);
  const grain=makeGrain(),owned=[],stoneMaterials=Array.from({length:6},(_,i)=>{
    const source=materials.wetStone??materials.paving??materials.stone;
    const m=source?.isMeshStandardMaterial?source.clone():new T.MeshStandardMaterial();
    m.name=`reference10-threshold-granite-${i}`;m.map=grain;m.color.setRGB(.80+i*.014,.82+i*.013,.79+i*.013);m.roughness=.25+i*.008;m.metalness=0;m.emissive.set(0);m.bumpMap=grain;m.bumpScale=.00055;m.normalMap=null;m.roughnessMap=null;m.vertexColors=false;if('clearcoat'in m)m.clearcoat=0;owned.push(m);return m;
  });
  const holes=plan.cutouts.map(h=>{const p=h.worldPolygon.map(([x,z])=>[x-ox,z-oz]);if(signedArea(p)<0)p.reverse();return {polygon:p,bounds:extent(p)};});
  const width=b.maxX-b.minX,depth=b.maxZ-b.minZ,rows=4,rowStep=depth/rows,gap=.018,parts=stoneMaterials.map(()=>[]),slabs=[];
  for(let row=0;row<rows;row++){
    const z0=-depth/2+row*rowStep+gap/2,z1=z0+rowStep-gap;
    const count=row%2?18:17,weights=Array.from({length:count},(_,j)=>.86+.12*Math.sin(j*2.3+row*1.7)+.08*Math.cos(j*1.2-row)),sum=weights.reduce((a,b)=>a+b,0);let x=-width/2;
    for(let col=0;col<count;col++){
      const cellWidth=width*weights[col]/sum,x0=x+gap/2,x1=x+cellWidth-gap/2,ch=.006+.003*(1+Math.sin(col*3.1+row))*.5;
      let poly=[[x0+ch,z0],[x1-ch,z0],[x1,z0+ch],[x1,z1-ch],[x1-ch,z1],[x0+ch,z1],[x0,z1-ch],[x0,z0+ch]],pieces=[poly],cutCount=0;
      const slabBounds=extent(poly),originalArea=signedArea(poly);
      for(const hole of holes)if(overlaps(slabBounds,hole.bounds)&&convexIntersection(poly,hole.polygon).length){pieces=pieces.flatMap(p=>subtractConvex(p,hole.polygon));cutCount++;}
      if(pieces.length){const cx=(x0+x1)/2,cz=(z0+z1)/2,topAt=p=>{const d=Math.min(...holes.map(h=>boundaryDistance(p,h.polygon))),t=T.MathUtils.clamp(d/.025,0,1),rimBlend=t*t*(3-2*t);return plan.stoneTop-.0013*rimBlend*Math.max(0,1-((p[0]-cx)/((x1-x0)/2))**2)*Math.max(0,1-((p[1]-cz)/((z1-z0)/2))**2);};
        const g=extrusion(pieces,plan.stoneBottom,topAt);parts[(row*3+col)%6].push(g);slabs.push({row,col,worldBounds:{minX:x0+ox,maxX:x1+ox,minZ:z0+oz,maxZ:z1+oz},originalArea,remainingArea:pieces.reduce((s,p)=>s+signedArea(p),0),columnCutouts:cutCount,pieces:pieces.length,geometry:g});}
      x+=cellWidth;
    }
  }
  for(let i=0;i<parts.length;i++)if(parts[i].length){const g=mergeGeometries(parts[i]),mesh=new T.Mesh(g,stoneMaterials[i]);mesh.name=`threshold-cut-flagstones-${i}`;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  const stats={version:'reference10-cut-threshold-v1.1',slabs:slabs.length,slabsCutAroundColumns:slabs.filter(s=>s.columnCutouts).length,holes:holes.length,meshes:group.children.length,triangles:group.children.reduce((s,m)=>s+m.geometry.attributes.position.count/3,0),worldRandomDraws:0,internalPartitionWalls:0};
  group.updateMatrixWorld(true);
  function getSurfaceMetadata(){group.updateWorldMatrix(true,false);const normal=new T.Vector3(0,1,0).applyNormalMatrix(new T.Matrix3().getNormalMatrix(group.matrixWorld)),point=new T.Vector3(0,plan.stoneTop,0).applyMatrix4(group.matrixWorld);return {stoneTop:Math.abs(normal.y-1)<1e-8?point.y:null,puddlePlaneY:null,worldPlanePoint:point.toArray(),worldPlaneNormal:normal.toArray(),matrixWorld:group.matrixWorld.toArray(),materials:stoneMaterials,reflectorInstalled:false};}
  return {group,plan,materials:{stone:stoneMaterials},stats,slabs,cutouts:plan.cutouts,getSurfaceMetadata,
    support:{stoneBottom:plan.stoneBottom,requiresSeparateContinuousPlatformAt:plan.platformTop},
    reflection:{installed:false,surfaceY:plan.stoneTop,reason:'The .108m floor must not be merged into the existing .0324m planar reflector as though coplanar.'},
    drain:{installed:false,reason:'Candidate-B photo drain back-projection extends beyond this dry threshold; it requires a separate explicit camera/forecourt decision.'},
    dispose(){for(const m of group.children)m.geometry.dispose();for(const p of parts)for(const g of p)g.dispose();for(const m of owned)m.dispose();grain.dispose();group.removeFromParent();}};
}
