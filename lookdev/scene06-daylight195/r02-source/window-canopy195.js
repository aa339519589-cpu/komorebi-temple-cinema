import * as T from 'three';

// Inferred real exterior maple boughs, never a beam mask or scene backdrop.
// Their leaves/branches occlude the actual direct sun and shadowed air volume.
export function buildWindowCanopy195(scene){
 const root=new T.Group();root.name='scene06-exterior-maple-solar-occluder195';scene.add(root);
 const bark=new T.MeshStandardMaterial({color:0x3f2b1e,roughness:.94}),leafMaterials=[0x33442b,0x5d632b,0x65592a].map(color=>new T.MeshStandardMaterial({color,roughness:.83,side:T.DoubleSide}));
 const leaves=[],parts=[],tipCap=new T.SphereGeometry(1,8,5);parts.push(tipCap);let state=1950623;const r=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
 const stem=(points,radius)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(curve,20,radius,9,false),m=new T.Mesh(g,bark);m.castShadow=m.receiveShadow=true;root.add(m);parts.push(g);for(const p of[points[0],points.at(-1)]){const cap=new T.Mesh(tipCap,bark);cap.position.fromArray(p);cap.scale.setScalar(radius);cap.castShadow=cap.receiveShadow=true;root.add(cap);}};
 const soilMaterial=new T.MeshStandardMaterial({color:0x3c3021,roughness:1}),soilGeometry=new T.BoxGeometry(6,.4,16),soil=new T.Mesh(soilGeometry,soilMaterial);soil.position.set(-10.2,-.35,-1);soil.castShadow=soil.receiveShadow=true;root.add(soil);parts.push(soilGeometry);
 stem([[-10.95,-.27,-5.9],[-10.85,.8,-5.7],[-10.7,1.5,-5.5],[-10.0,4,-3.5],[-9.3,6.2,-1.8],[-8.5,7.9,.5]],.12);
 for(const p of[[-11.9,-.16,-5.6],[-10.6,-.16,-6.7],[-10.2,-.16,-5.4]])stem([p,[-10.9,-.06,-5.85],[-10.85,.5,-5.8]],.045);
 const patches=[[-9.45,6.3,-4.6],[-8.85,7.1,-2.8],[-9.3,6.5,-.5],[-8.75,7.2,1.5],[-9.8,7.4,3.0]];
 const shape=new T.Shape();for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI*2/20,rad=i%4===0?1:i%2===0?.55:.70;const p=[Math.cos(a)*rad,Math.sin(a)*rad];i?shape.lineTo(...p):shape.moveTo(...p);}shape.closePath();
 const leaf=new T.ExtrudeGeometry(shape,{depth:.014,bevelEnabled:false,curveSegments:1});
 const lp=leaf.attributes.position;for(let i=0;i<lp.count;i++)lp.setZ(i,lp.getZ(i)+.13*lp.getX(i)*lp.getX(i)-.08*lp.getY(i));leaf.computeVertexNormals();parts.push(leaf);
 for(const [j,p]of patches.entries()){
  stem([[-9.7,5.9,-2.5],[(p[0]-9.7)/2,(p[1]+5.9)/2,(p[2]-2.5)/2],p],.035);
  for(let i=0;i<150;i++){
   const a=r()*Math.PI*2,s=Math.sqrt(r()),x=p[0]+Math.cos(a)*s*.70,y=p[1]+(r()-.5)*.85,z=p[2]+Math.sin(a)*s*1.0;
   const scale=.08+r()*.065,matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2+(r()-.5)*1.15,(r()-.5)*.8,a)),new T.Vector3(scale,scale,scale));
   leaves.push({matrix,material:(i+j)%3});
   const base=new T.Vector3(0,-.75,0).applyMatrix4(matrix).toArray();
   stem([p,[(p[0]+base[0])*.5,(p[1]+base[1])*.5+.035,(p[2]+base[2])*.5],base],.0018);
  }
 }
 for(let j=0;j<3;j++){const local=leaves.filter(l=>l.material===j),mesh=new T.InstancedMesh(leaf,leafMaterials[j],local.length);local.forEach((l,i)=>mesh.setMatrixAt(i,l.matrix));mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
 return{root,info:{revision:'scene06-rooted-exterior-solar-leaf-occlusion195-r02',leafCount:leaves.length,scope:'Inferred exterior tree on an actual ground volume, connected boughs/petioles and real shadow-casting leaves at left-window solar incidence; no reference image or view-space light mask',visualAccepted:false},dispose(){root.removeFromParent();for(const g of parts)g.dispose();bark.dispose();soilMaterial.dispose();for(const m of leafMaterials)m.dispose();}};
}
