/** Replace only the identified sanctuary floorboards with broad joined panels. */
import * as T from 'three';
export function createSanctuaryFloorPanelStudy(temple){
 if(!temple?.scene?.isScene)throw Error('Require current temple scene');
 const {scene,renderer}=temple,reflector=scene.getObjectByName('restoration-sanctuary-floor-clearcoat');
 if(!reflector?.material?.uniforms?.plankPitch)throw Error('Existing sanctuary floor reflector missing');
 scene.updateMatrixWorld(true);
 const records=[],centers=[],world=new T.Matrix4(),local=new T.Matrix4(),s=new T.Vector3(),p=new T.Vector3();let originalMaterial=null;
 scene.traverse(mesh=>{
  if(!mesh.isInstancedMesh||mesh.material?.name!=='cedar'||mesh.geometry.type!=='BoxGeometry')return;
  const selected=[];
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,local);world.multiplyMatrices(mesh.matrixWorld,local);s.setFromMatrixScale(world);p.setFromMatrixPosition(world);
   if(Math.abs(s.x-.268*.81)<1e-5&&Math.abs(s.y-.07*1.05)<1e-5&&Math.abs(s.z-14.2*.768)<1e-5&&Math.abs(p.y-3.4*1.05)<1e-5&&Math.abs(p.z+7.115090396)<1e-5){selected.push(i);centers.push(p.clone());originalMaterial=mesh.material;}
  }
  if(selected.length)records.push({mesh,selected,count:mesh.count,matrix:mesh.instanceMatrix.array.slice(),colors:mesh.instanceColor?.array.slice(),box:mesh.boundingBox?.clone(),sphere:mesh.boundingSphere?.clone()});
 });
 if(centers.length!==65||!originalMaterial)throw Error('Expected exactly 65 existing narrow sanctuary boards, got '+centers.length);
 const xMin=Math.min(...centers.map(p=>p.x))-.268*.81/2,xMax=Math.max(...centers.map(p=>p.x))+.268*.81/2,zMin=centers[0].z-14.2*.768/2,zMax=centers[0].z+14.2*.768/2,y=centers[0].y;
 const columns=18,rows=4,pitch=(xMax-xMin)/columns,length=(zMax-zMin)/rows,gap=.0064,mat=originalMaterial.clone();
 mat.name='reference6-broad-joined-cedar';mat.onBeforeCompile=originalMaterial.onBeforeCompile;mat.customProgramCacheKey=()=>originalMaterial.customProgramCacheKey()+':reference6-broad-floor';mat.roughness=.38;
 const geometry=new T.BoxGeometry(pitch-gap,.07*1.05,length-gap),panels=new T.InstancedMesh(geometry,mat,columns*rows),dummy=new T.Object3D(),color=new T.Color();
 panels.name='reference6-broad-floor-panels-study';panels.castShadow=panels.receiveShadow=true;panels.visible=false;
 for(let col=0;col<columns;col++)for(let row=0;row<rows;row++){
  const index=col*rows+row;dummy.position.set(xMin+(col+.5)*pitch,y,zMin+(row+.5)*length);dummy.updateMatrix();panels.setMatrixAt(index,dummy.matrix);
  const tint=.94+.045*Math.sin(col*2.71+row*1.37);color.setRGB(tint,tint*.98,tint*.955);panels.setColorAt(index,color);
 }
 panels.instanceMatrix.needsUpdate=true;panels.instanceColor.needsUpdate=true;panels.computeBoundingBox();panels.computeBoundingSphere();scene.add(panels);
 const m=reflector.material,original={fragment:m.fragmentShader,origin:m.uniforms.floorOrigin.value.clone(),pitch:m.uniforms.plankPitch.value,lod:m.uniforms.floorReflectionLod.value};
 const marker='float alpha = clamp(fresnel * floorStrength, 0.0, .78) * seam;';
 if(m.fragmentShader.split(marker).length!==2){scene.remove(panels);geometry.dispose();mat.dispose();throw Error('Pinned floor reflection seam shader changed');}
 // Signed world coordinates must be parenthesized. Otherwise subtracting a
 // negative zMin creates GLSL's decrement token (z--12.56), not subtraction.
 const patched=original.fragment.replace(marker,`float across=fract((vFloorWorld.z-(${zMin.toFixed(9)}))/(${length.toFixed(9)}));
float acrossDistance=min(across,1.0-across)*${length.toFixed(9)};
float acrossAA=max(fwidth(acrossDistance),.0003);
seam*=smoothstep(.002- acrossAA,.005+acrossAA,acrossDistance);
${marker}`);
 let applied=false,disposed=false;
 function restore(){
  if(disposed)return;
  if(applied)for(const r of records){r.mesh.instanceMatrix.array.set(r.matrix);r.mesh.instanceMatrix.needsUpdate=true;if(r.colors){r.mesh.instanceColor.array.set(r.colors);r.mesh.instanceColor.needsUpdate=true;}r.mesh.count=r.count;r.mesh.boundingBox=r.box?.clone()??null;r.mesh.boundingSphere=r.sphere?.clone()??null;}
  panels.visible=false;m.fragmentShader=original.fragment;m.uniforms.floorOrigin.value.copy(original.origin);m.uniforms.plankPitch.value=original.pitch;m.uniforms.floorReflectionLod.value=original.lod;m.needsUpdate=true;renderer.shadowMap.needsUpdate=true;applied=false;
 }
 function apply({reflectionLod=.8}={}){
  if(disposed)throw Error('Floor panel study disposed');if(!Number.isFinite(reflectionLod)||reflectionLod<0||reflectionLod>4)throw Error('Invalid floor reflection roughness');
  if(temple.info().lightingMode!=='sanctuary')throw Error('Sanctuary floor study requires reference6');restore();
  for(const r of records){const removed=new Set(r.selected);let at=0;for(let i=0;i<r.count;i++)if(!removed.has(i)){r.mesh.instanceMatrix.array.set(r.matrix.subarray(i*16,(i+1)*16),at*16);if(r.colors)r.mesh.instanceColor.array.set(r.colors.subarray(i*3,(i+1)*3),at*3);at++;}r.mesh.count=at;r.mesh.instanceMatrix.needsUpdate=true;if(r.colors)r.mesh.instanceColor.needsUpdate=true;r.mesh.boundingBox=null;r.mesh.boundingSphere=null;r.mesh.computeBoundingBox();r.mesh.computeBoundingSphere();}
  panels.visible=true;m.fragmentShader=patched;m.uniforms.floorOrigin.value.set(xMin+pitch*.5,(zMin+zMax)*.5);m.uniforms.plankPitch.value=pitch;m.uniforms.floorReflectionLod.value=reflectionLod;m.needsUpdate=true;renderer.shadowMap.needsUpdate=true;applied=true;return info();
 }
 function info(){return{active:applied,oldBoards:65,newClosedPanels:columns*rows,columns,rows,bounds:{x:[xMin,xMax],z:[zMin,zMax],top:y+.07*1.05/2},gap,boardPitch:pitch,panelLength:length,reflectionUsesActualScene:true,textureImagesAdded:0,otherInstancesRemoved:0,roomEnvironmentRebaked:false};}
 return{apply,restore,info,dispose(){if(disposed)return;restore();panels.removeFromParent();geometry.dispose();mat.dispose();disposed=true;}};
}
