// One level and one bounded plan drive the visible water, reflected world,
// floating plants and the dry/wet bank transition. HD02 pier-foot rays place
// this level aroundY1.0 under the retained physical reference camera.
export const pondLevel210=1.0;
export const pondShore210=[[-30,1],[-28,-1.5],[-23,-2.8],[-18,-2.2],[-14,-.8],[-10,-.75],[-7,-.90],[-4,-1.1],[-1,-1.30],[2,-1.10],[5,-.45],[8,.6],[10,2.2],[10.8,5.1],[11.5,8.1],[12.4,11.0],[13.4,15.0],[14.8,20.5],[16.2,27.0],[17.8,35.0],[17.6,42.0],[7.0,44.0],[-6.0,44.3],[-21.0,42.8],[-29.4,37.1],[-33.0,29.1],[-34.2,20.4],[-33.6,10.4],[-30.4,5.8]];
export function insidePond210(x,z){let inside=false;for(let i=0,j=pondShore210.length-1;i<pondShore210.length;j=i++){const a=pondShore210[i],b=pondShore210[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
