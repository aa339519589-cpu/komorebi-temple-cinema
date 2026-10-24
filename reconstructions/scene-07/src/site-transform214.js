import * as T from 'three';

// R12 depth reconstruction. One fixed metric similarity resites the complete
// temple / bridge / stair setting, including its real light sources. This is
// a static authored 3D transformation, with no runtime camera input, mesh card
// or photographic projection. Water and the near veranda retain their datum.
export const MIDGROUND_SITE214=Object.freeze({revision:'scene07-lower-water-bank-depth214-r12',scale:1.4,pivot:Object.freeze([10.7,12.8,36])});
// R18 lowers the complete hall/floor/stair head as one physical datum while
// increasing the upper roof's rise. Captures and practicals share the offset.
export const HALL_DATUM_OFFSET214=-.20;
export const UPPER_HALL_ROOF_RISE214=6.40;
export const UPPER_HALL_ROOF_EAVE214=10.10;
export const UPPER_HALL_ROOF_RIDGE_FRACTION214=.38;
export const UPPER_HALL_ROOF_SKEW214=.625;
export const UPPER_HALL_ROOF_CENTRE214=Object.freeze([.55,0,-3]);
export const UPPER_STOREY_PLAN214=Object.freeze({scaleX:.90,offsetX:.30});
export function upperStoreyPoint214(p){
 const c=Math.cos(-.25),s=Math.sin(-.25),dx=p[0]-4.6,dz=p[2]+9,x=c*dx-s*dz,z=s*dx+c*dz,xx=UPPER_STOREY_PLAN214.offsetX+UPPER_STOREY_PLAN214.scaleX*x;
 return[4.6+c*xx+s*z,p[1],-9-s*xx+c*z];
}
export function hallLocalPoint214(p,{upper=false}={}){
 const x=upper?UPPER_STOREY_PLAN214.offsetX+UPPER_STOREY_PLAN214.scaleX*p[0]:p[0],c=Math.cos(-.25),s=Math.sin(-.25);
 return[4.6+c*x+s*p[2],5+HALL_DATUM_OFFSET214+.88*p[1],-9-s*x+c*p[2]];
}
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
