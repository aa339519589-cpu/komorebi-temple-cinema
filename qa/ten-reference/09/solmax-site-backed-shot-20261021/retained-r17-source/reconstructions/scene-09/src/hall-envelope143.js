// One source09 geometric envelope drives the roof shells and their bearings.
// Photograph landmarks are comparison measurements, never scene pixels.
export const HALL_ENVELOPE143={
 position:[7.7,0,-14],yaw:-.64,scale:[1,1.17,1],floor:3.09,
 lower:{w:21.30,d:14.5,frontDepth:8.30,backDepth:6.20,e:7.25,rise:3,curl:.62,inner:.58,label:'scene09-open-sanctuary-annular-eave143',supports:[{xs:[-9.8,-7.2,-4.3,-1.2,2.1,5.2,7.4],z:4.80,head:7.80}]},
 upper:{w:20.09,d:15,frontDepth:9,backDepth:6,e:9.8,rise:6.15,curl:.78,gabled:true,gableCut:.30,slopePower:1.68,ridgeLeft:6.85,ridgeRight:5.25,ornamentHeight:.42,label:'scene09-open-sanctuary-hip-gable143',supports:[{xs:[-7.9,-4.34,-.96,2.10,4.84,7.07],z:5.20,head:10.73},{xs:[-8.5,-5.6,-2.8,0,2.8,5.6,8.5],z:-3.45,head:10.25}]},
 revision:'scene09-common-roof-bearing-envelope143'
};
export function roofBearing143(x,z,upper){
 const S=upper?HALL_ENVELOPE143.upper:HALL_ENVELOPE143.lower,half=S.w/2,cut=S.gabled?S.gableCut:0,power=S.slopePower??1.49,left=S.ridgeLeft??S.w*.24,right=S.ridgeRight??S.w*.24,span=(t,r)=>r+(half-r)*(cut?Math.max(0,(t-cut)/(1-cut)):t);
 let t=Math.abs(z)/(z>=0?S.frontDepth:S.backDepth),u=(2*x+span(t,left)-span(t,right))/(span(t,left)+span(t,right));
 if(x>span(t,right)||x< -span(t,left)){const r=x>=0?right:left;t=cut+(1-cut)*(Math.abs(x)-r)/(half-r);u=z/((z>=0?S.frontDepth:S.backDepth)*t);}
 return S.e+S.rise*Math.pow(Math.max(0,1-t),power)+S.curl*Math.pow(t,10)*(.17+.83*Math.pow(Math.abs(u),8))+(upper?.11:.035)*Math.pow(1-t,8)*Math.pow(Math.abs(u),8)-.31;
}
