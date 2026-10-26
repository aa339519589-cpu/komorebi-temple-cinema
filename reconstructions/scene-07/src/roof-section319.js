// Shared physical main-roof section: ridge/eave anchors stay fixed, while
// one continuous ogee section governs tile bedding, rafters and frame queries.
const K=[[0,1,-1.10],[.20,.76,-1.45],[.50,.37,-1.05],[.78,.075,-.50],[1,0,0]];
export function roofRise319(t){if(t<=0)return 1;if(t>=1)return 0;let i=0;while(i<K.length-2&&t>K[i+1][0])i++;const[a,y,m]=K[i],[b,z,n]=K[i+1],h=b-a,u=(t-a)/h;return(2*u**3-3*u*u+1)*y+(u**3-2*u*u+u)*h*m+(-2*u**3+3*u*u)*z+(u**3-u*u)*h*n;}
export function inverseRoofRise319(y){y=Math.max(0,Math.min(1,y));let a=0,b=1;for(let i=0;i<40;i++){const m=(a+b)/2;if(roofRise319(m)>y)a=m;else b=m;}return(a+b)/2;}
export function ridgeCamber319(spec,x,t){const half=spec.w*(spec.ridgeFraction??.30);return .17*Math.min(1,Math.abs(x)/half)**4*Math.max(0,1-t)**3;}
export const section319={knots:K,peakAndEaveAnchorsHeld:true,ridgeEndCamber:.17,referencePixelsUsed:false};
