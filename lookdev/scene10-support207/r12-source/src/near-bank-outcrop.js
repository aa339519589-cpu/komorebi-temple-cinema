import * as T from 'three';

// One local near-right bank mass. These are the existing CC0 scan geometries,
// with their native eroded sections, normals, UVs and PBR intact. No sphere
// normalization, vertex noise, shared random calls, or reflection shader edits.
export function buildNearBankOutcrop(stones,emit,{offsetX=0}={}){
 const placements=[
  {part:'upright-main-stone',variant:3,x:3.62,z:3.98,scale:.67,rotation:[.10,-.65,-.10],bottom:-.27},
  {part:'low-waterline-shoulder',variant:0,x:3.02,z:4.40,scale:.50,rotation:[-.04,.32,.035],bottom:-.18},
  {part:'submerged-toe-stone',variant:4,x:4.03,z:4.54,scale:.38,rotation:[.06,-.80,.02],bottom:-.16}
 ].map(p=>({...p,x:p.x+offsetX}));
 const records=[];
 for(const p of placements){
  const scan=stones.variants[p.variant],q=new T.Quaternion().setFromEuler(new T.Euler(...p.rotation));
  const rotationScale=new T.Matrix4().compose(new T.Vector3(),q,new T.Vector3().setScalar(p.scale));
  const bounds=new T.Box3(),v=new T.Vector3(),position=scan.geometry.attributes.position;
  for(let i=0;i<position.count;i++)bounds.expandByPoint(v.fromBufferAttribute(position,i).applyMatrix4(rotationScale));
  const y=p.bottom-bounds.min.y;
  bounds.translate(new T.Vector3(p.x,y,p.z));
  emit(scan.geometry,scan.wet,p.x,y,p.z,p.scale,p.scale,p.scale,p.rotation,1);
  records.push({...p,y,bounds:[bounds.min.toArray(),bounds.max.toArray()],vertices:position.count,triangles:(scan.geometry.index?.count??position.count)/3,material:scan.wet.name});
 }
 return{
  scope:'Three interlocking physical scan pieces forming one exposed local bank outcrop; rigid whole-bank offset follows the revised path boundary',
  assemblyOffsetX:offsetX,
  source:stones.info,records,
  substrate:'Stone bodies extend below the existing water/soil level; the low shoulder and toe interrupt the waterline rather than hovering above it',
  geometryTransfer:'Original scanned positions, normals and UVs unmodified; rigid pose and one scale factor per stone only',
  acceptance:'Local modeling candidate, not a photographic match'
 };
}
