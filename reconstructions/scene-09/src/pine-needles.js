import * as T from 'three';
// One closed 3D tuft: thirty tapered triangular needles attached to a stem.
// It replaces horizontal alpha cards whose low-angle silhouette vanished.
export function createPineNeedleTuft(){
 const p=[],uv=[],ids=[];
 function needle(a,b,r){const axis=b.clone().sub(a).normalize(),side=new T.Vector3(0,1,0).cross(axis).normalize();if(side.lengthSq()<.01)side.set(1,0,0);const other=axis.clone().cross(side).normalize(),start=p.length/3;for(let i=0;i<3;i++){const q=a.clone().addScaledVector(side,Math.cos(i*Math.PI*2/3)*r).addScaledVector(other,Math.sin(i*Math.PI*2/3)*r);p.push(q.x,q.y,q.z);uv.push(i/3,0);}p.push(b.x,b.y,b.z);uv.push(.5,1);ids.push(start,start+2,start+1,start,start+1,start+3,start+1,start+2,start+3,start+2,start,start+3);}
 for(let i=0;i<30;i++){const a=i*2.39996,reach=.32+.17*(.5+.5*Math.sin(i*7.31)),base=new T.Vector3(Math.sin(a)*.025,0,Math.cos(a)*.025),tip=new T.Vector3(Math.sin(a)*reach,.10+.22*(.5+.5*Math.cos(i*2.17)),Math.cos(a)*reach);needle(base,tip,.009);}
 needle(new T.Vector3(0,-.04,0),new T.Vector3(0,.15,0),.025);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
