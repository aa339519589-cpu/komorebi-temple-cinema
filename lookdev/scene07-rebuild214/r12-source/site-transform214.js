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
