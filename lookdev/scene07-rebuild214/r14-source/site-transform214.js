import * as T from 'three';

// R12 depth reconstruction. One fixed metric similarity resites the complete
// temple / bridge / stair setting, including its real light sources. This is
// a static authored 3D transformation, with no runtime camera input, mesh card
// or photographic projection. Water and the near veranda retain their datum.
export const MIDGROUND_SITE214=Object.freeze({revision:'scene07-lower-water-bank-depth214-r12',scale:1.4,pivot:Object.freeze([10.7,12.8,36])});
export const siteY214=y=>12.8+(y-12.8)*1.4;
export const unsiteY214=y=>12.8+(y-12.8)/1.4;
export const sitePoint214=p=>[10.7+(p[0]-10.7)*1.4,siteY214(p[1]),36+(p[2]-36)*1.4];
export const unsitePoint214=p=>[10.7+(p[0]-10.7)/1.4,unsiteY214(p[1]),36+(p[2]-36)/1.4];
export const SITE_MATRIX214=new T.Matrix4().makeTranslation(10.7,12.8,36).multiply(new T.Matrix4().makeScale(1.4,1.4,1.4)).multiply(new T.Matrix4().makeTranslation(-10.7,-12.8,-36));

// Actual return to the eastern mainland, outside the photographic crop for
// most of its turn. The garden walk no longer terminates over open water.
export const BANK_RETURN214=Object.freeze([
 Object.freeze([12.66,.788,-8.24]),Object.freeze([17.4,.70,-3.0]),
 Object.freeze([18.4,.85,3.5]),Object.freeze([15.0,1.10,7.3])
]);
export function bankReturnHalfWidth214(segment,t){
 const a=BANK_RETURN214[segment],b=BANK_RETURN214[segment+1],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
 return 1.4+(segment===0?.56*Math.max(0,1-t*len/2.5):0);
}
