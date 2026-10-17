import * as T from 'three';
import {shots,cameraPoseForShot} from './cinematography.js';
import {mapReferenceExteriorPoint} from './restoration-landscape-layout.js';

// Explicit world-space still cameras. These are reproducible reconstruction
// candidates, not calibrated photographic camera recovery. In particular the
// inherited ground-level route for reference8 does not yet reproduce its raised
// veranda foreground. Never derive sunlight from the moving film camera.
const overrides={
 3:{position:[-4,.33458133,17.8],target:[-6.706646254,4.882904748,-2.52207716],fov:58.276164718,time:18.6,status:'reference-landmark/site-layout candidate; not pixel accepted'},
 5:{position:[-12.340726762,1.5,-3.515090396],target:[-18.340726762,15.6,-15.515090396],fov:50,time:31.5,status:'low-angle corner/eaves inspection candidate; not a matched reference camera'},
 6:{position:[-1.540726762,4.26,-2.375090396],target:[-1.540726762,6,-9.755090396],fov:78,time:41.95,status:'existing sanctuary candidate; vertical convergence and exact depth calibration unresolved'}
};
const records=shots.map((shot,index)=>{
 const pose=cameraPoseForShot(index,3.5),base={reference:index+1,name:shot.name,position:mapReferenceExteriorPoint(pose.position.toArray()),target:mapReferenceExteriorPoint(pose.target.toArray()),fov:pose.fov,time:index*7+3.5,status:'inherited film-midpoint candidate; reference camera not matched'};
 const record={...base,...overrides[index+1]};
 return Object.freeze({...record,position:Object.freeze([...record.position]),target:Object.freeze([...record.target])});
});
export const referenceViews=Object.freeze(records);
export const reference10Scene=Object.freeze({
 variant:'reference10-porch',reference:10,mode:'rain',taperStep:.065,finialHeight:7.2,finialRingCount:7,
 towerYaw:0.6058561892901734,
 position:Object.freeze([-16.22035572983939, 0.6962882489311694, 24.074999999999996]),
 target:Object.freeze([-11.02454356790217, 2.2683799187311875, -5.429780354369882]),fov:60.07108337546772,time:66.5,
 status:'Supported low-tripod candidate E with corrected visible-footing correspondence; partial reference10 reconstruction, not photographic calibration',
 provenance:'CPU bounded local fitting to visible 32-edge footing and actual bridge polyline; conditional tower yaw with actual soil and listed garden clearance checks. No tower XZ/profile change. Tower layers, four of eight source-image handrail rays, foreground lamp and red canopy remain unresolved.'
});
export function getReferenceView(reference,{sceneVariant='shared'}={}){
 if(!['shared','reference10-porch'].includes(sceneVariant))throw new RangeError('Unknown reference scene variant.');
 if(sceneVariant==='reference10-porch'){
  if(reference!==10)throw new RangeError('The reference10 conditional scene may only render reference10.');
  return {...records[9],...reference10Scene,position:[...reference10Scene.position],target:[...reference10Scene.target]};
 }

 if(!Number.isInteger(reference)||reference<1||reference>10)throw new RangeError('Reference must be an integer from1 to10.');
 const record=records[reference-1];return{...record,position:[...record.position],target:[...record.target]};
}
export function createFixedReferenceCameras({aspect=1,near=.12,far=550}={}){
 if(!Number.isFinite(aspect)||aspect<=0||!Number.isFinite(near)||near<=0||!Number.isFinite(far)||far<=near)throw new RangeError('Invalid reference-camera frustum.');
 return Object.fromEntries(records.map(view=>{const camera=new T.PerspectiveCamera(view.fov,aspect,near,far);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.updateProjectionMatrix();camera.updateMatrixWorld(true);camera.userData.reference=view.reference;camera.userData.calibrationStatus=view.status;return[view.reference,camera];}));
}
