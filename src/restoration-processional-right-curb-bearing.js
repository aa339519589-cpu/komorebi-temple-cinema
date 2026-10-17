import * as T from 'three';

/** Hidden bearing repair for the existing original4 processional curbs.
 * No walking geometry, route, planting, camera, water or random stream changes.
 * World-space output. Add directly to the scene, never inside siteMatrix.
 * This bounded handoff fixes only the right-side eight curbs. Left bearing and
 * shoreline-cluster relocation are withheld, not silently promoted.
 * Subsurface dimensions are conservative construction choices, not photo data.
 */
export function buildRestorationProcessionalRightCurbBearing({wetPath,material,options={}}={}){
  if(!wetPath?.group?.isGroup||!wetPath?.groups?.edges?.isGroup||!wetPath?.replacementBounds)throw new TypeError('The actual built wet-path result is required.');
  if(!material?.isMaterial)throw new TypeError('Borrowed masonry material is required.');
  const bounds=wetPath.replacementBounds;
  wetPath.group.updateWorldMatrix(true,true);
  const e=wetPath.group.matrixWorld.elements;
  if(!e.every(Number.isFinite)||!Number.isFinite(bounds.yaw))throw new RangeError('Nonfinite path transform.');
  if([1,2,3,4,6,7,8,9,11].some(i=>Math.abs(e[i])>1e-10)||[0,5,10,15].some(i=>Math.abs(e[i]-1)>1e-10)||Math.abs(bounds.yaw)>1e-10)throw new RangeError('This bearing repair requires the current axis-aligned, unscaled world-space path.');
  const centreX=e[12],coreWidth=options.existingCoreWidth??3.0,coreOverlap=options.coreOverlap??.010,edgeMargin=options.edgeMargin??.010,curbEmbed=options.curbEmbed??.0116,bottom=options.foundationBottom??-.420,waterY=options.waterY??-.120;
  if(![centreX,coreWidth,coreOverlap,edgeMargin,curbEmbed,bottom,waterY].every(Number.isFinite)||coreWidth<=0||coreOverlap<=0||edgeMargin<=0||curbEmbed<=0||coreOverlap>=coreWidth/2)throw new RangeError('Invalid bearing dimensions.');
  // The actual v49 terrain audit finds only left rows0..8 and right rows0..7 lack complete bearing.
  // Do not continue new masonry under the already supported dry-bank rows.
  if(Math.abs(bounds.width-3.012)>1e-9||Math.abs(bounds.length-15.288)>1e-9||Math.abs(e[12]+1.540726762)>1e-9||Math.abs(e[14]-17.775909604)>1e-9)throw new RangeError('This bounded repair requires the audited current path footprint.');
  const rows=16,supportRowCounts=[9,8],rowStep=bounds.length/rows;
  const sides=[{side:-1,box:new T.Box3(),points:0},{side:1,box:new T.Box3(),points:0}];
  wetPath.groups.edges.traverse(mesh=>{
    if(!mesh.isMesh)return;
    if(mesh.isInstancedMesh)throw new RangeError('Unexpected instanced curb format; audit the actual instances first.');
    const p=mesh.geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
      const sideIndex=v.x<centreX?0:1,row=Math.max(0,Math.min(rows-1,Math.floor((v.z-e[14]+bounds.length/2)/rowStep)));
      if(row>=supportRowCounts[sideIndex])continue;
      const s=sides[sideIndex];s.box.expandByPoint(v);s.points++;
    }
  });
  if(sides.some(s=>!s.points||s.box.isEmpty()))throw new RangeError('Both existing curb rows must have actual geometry.');
  const top=Math.min(...sides.map(s=>s.box.min.y))+curbEmbed;
  if(!(bottom<top&&top<waterY&&sides.every(s=>s.box.min.y<top&&s.box.max.y>top)))throw new RangeError('Bearing top must embed into the actual curb bottoms and remain below pond water.');
  const strips=sides.filter(s=>s.side===1).map(s=>{
    const outer=s.side<0?s.box.min.x-edgeMargin:s.box.max.x+edgeMargin;
    const inner=centreX+s.side*(coreWidth/2-coreOverlap);
    if((outer-inner)*s.side<=0)throw new RangeError('The existing core already spans the proposed outer bearing.');
    const x0=Math.min(outer,inner),x1=Math.max(outer,inner),z0=s.box.min.z-edgeMargin,z1=s.box.max.z+edgeMargin;
    if(!(x1>x0&&z1>z0))throw new RangeError('Nonpositive bearing footprint.');
    return{side:s.side,x0,x1,z0,z1,bottom,top,actualCurbBounds:{min:s.box.min.toArray(),max:s.box.max.toArray()}};
  });
  const geometry=new T.BoxGeometry(1,1,1),mesh=new T.InstancedMesh(geometry,material,strips.length),dummy=new T.Object3D();
  mesh.name='reference4-hidden-processional-curb-bearings';
  strips.forEach((s,i)=>{dummy.position.set((s.x0+s.x1)/2,(bottom+top)/2,(s.z0+s.z1)/2);dummy.scale.set(s.x1-s.x0,top-bottom,s.z1-s.z0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();
  const group=new T.Group();group.name='reference4-processional-curb-bearing-repair';group.add(mesh);group.updateMatrixWorld(true);
  const plan={version:'reference4-right-curb-bearing-v1',worldSpace:true,source:'Actual existing curb footprint, original4 low stone edging; no photo-derived subsurface dimensions.',centreX,rows,supportRowCounts:[0,8],supportedSides:[1],existingCoreWidth:coreWidth,coreOverlap,edgeMargin,curbEmbed,foundationBottom:bottom,bearingTop:top,waterY,strips,visiblePathChanged:false,worldRandomDraws:0,limits:'Only the right-side eight pond-reach curbs are repaired. The left-side nine unsupported curbs and its shoreline collisions remain unresolved; this module does not repair them. Soil, bed contact, original core overlap and nearby solids must be checked against the actual integrated world.'};
  group.userData.processionalCurbBearingPlan=plan;
  let disposed=false;
  return{group,plan,stats:{meshes:1,instances:1,triangles:12},dispose(){if(disposed)return;disposed=true;geometry.dispose();group.removeFromParent();}};
}
