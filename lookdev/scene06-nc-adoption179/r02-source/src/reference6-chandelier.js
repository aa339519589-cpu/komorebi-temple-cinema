import * as T from 'three';

// Dense central hanging ornament rebuilt as staggered chains. Fine suspension
// wires run directly from the cross rafters; no broad hoop or plate is visible.
export function createReference6Chandelier(materials) {
  const root=new T.Group();
  root.name='reference6-central-floral-chain-curtain';
  root.userData.reconstruction='108 independently suspended gilt chains on six staggered annular depth bands, rounded floral drops and direct timber suspension';
  root.userData.visibleHoopRings=0;
  const {gold,oldgold}=materials;
  const axis=new T.Vector3(0,1,0);

  function add(geometry,material,position=[0,0,0],rotation=null,parent=root,name=''){
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(...position);if(rotation)mesh.rotation.set(...rotation);
    mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function closedTube(path,segments,radius,radial){
    const g=new T.TubeGeometry(path,segments,radius,radial,false),p=Array.from(g.attributes.position.array),n=Array.from(g.attributes.normal.array),uv=Array.from(g.attributes.uv.array),ix=Array.from(g.index.array);
    for(const end of[0,1]){
      const center=path.getPointAt(end),axis=path.getTangentAt(end).normalize().multiplyScalar(end?1:-1),ci=p.length/3,rim=(end?segments:0)*(radial+1);
      p.push(center.x,center.y,center.z);n.push(axis.x,axis.y,axis.z);uv.push(.5,end);
      for(let k=0;k<radial;k++){
        const a=new T.Vector3().fromArray(p,(rim+k)*3).sub(center),b=new T.Vector3().fromArray(p,(rim+k+1)*3).sub(center);
        a.cross(b).dot(axis)>0?ix.push(ci,rim+k,rim+k+1):ix.push(ci,rim+k+1,rim+k);
      }
    }
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.userData.closedPhysicalWire=true;return g;
  }
  function tube(points,radius,material,name){
    const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
    const mesh=add(closedTube(path,Math.max(16,points.length*6),radius,6),material,[0,0,0],null,root,name);
    return {path,mesh};
  }
  const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};

  // The tiny leaf and flower are original closed geometry. Their thousands of
  // placements are InstancedMeshes so the 120 separate strands remain lean.
  function leafGeometry(){
    const g=new T.SphereGeometry(1,14,10),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),t=(y+1)*.5;
      const width=.48+.52*Math.sin(Math.PI*t)**.75;
      p.setXYZ(i,x*width,y,z*(.30+.70*Math.sin(Math.PI*t)));
    }
    g.computeVertexNormals();g.name='reference6-gilt-lanceolate-leaf-drop';return g;
  }
  function flowerGeometry(){
    const shape=new T.Shape();
    for(let i=0;i<=80;i++){
      const a=i/80*Math.PI*2,r=.034+.009*Math.cos(5*a),x=Math.cos(a)*r,y=Math.sin(a)*r;
      if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
    }
    shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:.014,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.004,bevelThickness:.004,curveSegments:3});
    g.translate(0,0,-.007);g.computeVertexNormals();g.name='reference6-five-petal-gilt-flower-bead';return g;
  }
  function crownGeometry(){
    const profile=[[0,-.035],[.016,-.034],[.027,-.025],[.022,-.010],[.031,-.003],[.023,.008],[.015,.033],[.008,.014],[0,.040]];
    const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),20);g.name='reference6-small-floral-crown-bead';return g;
  }
  function bellGeometry(){
    const profile=[[0,-.066],[.012,-.064],[.025,-.050],[.038,-.022],[.040,-.012],[.032,-.012],[.025,-.029],[.012,-.042],[0,-.042]];
    const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),20);g.name='reference6-small-open-gilt-bell';return g;
  }
  const linkGeometry=new T.TorusGeometry(.010,.0032,5,12);
  const eyeletGeometry=new T.TorusGeometry(.012,.0036,6,14);
  const leaf=leafGeometry(),flower=flowerGeometry(),crown=crownGeometry(),bell=bellGeometry();
  const instances={leaf:[[],[]],flower:[[],[]],crown:[[],[]],bell:[[],[]],link:[[],[]],eyelet:[[],[]]};
  const dummy=new T.Object3D();
  function record(kind,materialIndex,position,rotation,scale){instances[kind][materialIndex].push({position,rotation,scale});}
  function emitInstances(kind,geometry,materialsForInstances,name){
    for(let materialIndex=0;materialIndex<2;materialIndex++){
      const records=instances[kind][materialIndex];if(!records.length)continue;
      const mesh=new T.InstancedMesh(geometry,materialsForInstances[materialIndex],records.length);
      mesh.name=`reference6-instanced-${name}-${materialIndex?'shadow-gilt':'warm-gilt'}`;
      for(let i=0;i<records.length;i++){
        const r=records[i];dummy.position.set(...r.position);dummy.rotation.set(...r.rotation);dummy.scale.set(...r.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
    }
  }

  // Six staggered rows suspend directly from the underside of the real
  // transverse rafters at z=-1.6 and z=+1.6; there is no visible ring frame.
  const rows=[
    {radius:1.06,topY:6.96,drop:2.18},
    {radius:.98,topY:6.93,drop:2.40},
    {radius:.85,topY:6.90,drop:2.58},
    {radius:.70,topY:6.87,drop:2.70},
    {radius:.54,topY:6.84,drop:2.52},
    {radius:.35,topY:6.81,drop:2.26}
  ];
  const columns=18,faceClearance=.30;
  let strandCount=0,beadCount=0;
  for(let row=0;row<rows.length;row++){
    const cfg=rows[row],stagger=row%2?.40:0;
    for(let column=0;column<columns;column++){
      const angle=(column+stagger)/columns*Math.PI*2,x=Math.sin(angle)*cfg.radius+(random(row*91+column*17)-.5)*.025,strandZ=2.25+Math.cos(angle)*cfg.radius,beamZ=strandZ<2.4?1.60:4.80;
      const centerShort=Math.abs(x)<faceClearance;
      strandCount++;
      const jitter=random(row*101+column*7),sway=.018+(random(row*113+column)*.032);
      // The short center strands fill the canopy above the Buddha's crown;
      // outer strands descend farther, leaving the face corridor unobscured.
      const drop=centerShort ? 1.85+random(row*197+column*13)*.25 : cfg.drop+(random(row*197+column*13)-.5)*.48;
      const endY=cfg.topY-drop,tailX=(random(row*173+column*19)-.5)*.058,tailZ=(random(row*227+column*11)-.5)*.070;
      tube([[x,7.10,beamZ],[x+sway*.18,7.065,(beamZ+strandZ)*.5],[x+sway*.10,cfg.topY+.010,strandZ]],.0026,oldgold,`reference6-direct-beam-suspension-${row}-${column}`);
      const path=new T.CatmullRomCurve3([
        new T.Vector3(x,cfg.topY-.012,strandZ),
        new T.Vector3(x+sway*.35,cfg.topY-drop*.31,strandZ+tailZ*.4),
        new T.Vector3(x-sway*.48,cfg.topY-drop*.69,strandZ+tailZ),
        new T.Vector3(x+tailX,endY,strandZ+tailZ*.72)
      ],false,'centripetal');
      const steps=Math.max(22,Math.ceil(drop/.045));
      const core=new T.Mesh(closedTube(path,steps,.0034,5),jitter>.53?gold:oldgold);
      core.name=`reference6-curved-filigree-chain-row-${row}-column-${column}`;core.castShadow=true;core.receiveShadow=true;root.add(core);

      record('eyelet',jitter>.53?0:1,[x,7.10,beamZ],[Math.PI/2,0,random(column+row)*.1],[.90,.90,.90]);
      record('eyelet',jitter>.53?0:1,[x,cfg.topY-.012,strandZ],[Math.PI/2,0,random(column+row+31)*.1],[.76,.76,.76]);
      const linkCount=Math.max(8,Math.round(drop/.105));
      for(let linkIndex=0;linkIndex<linkCount;linkIndex++){
        const t=(linkIndex+.45)/linkCount,p=path.getPoint(t),tangent=path.getTangent(t);
        const angle=Math.atan2(tangent.x,tangent.y)+(linkIndex%2?Math.PI/2:0);
        record('link',(linkIndex+row+column)%4===0?1:0,p.toArray(),[Math.PI/2,angle,.04*Math.sin(column+linkIndex)],[.72+.24*random(row+linkIndex),1,.72+.24*random(column+linkIndex)]);
      }
      const ornaments=10+Math.floor(random(row*313+column*31)*9);beadCount+=ornaments;
      for(let ornament=0;ornament<ornaments;ornament++){
        const t=.10+.80*(ornament+.5)/ornaments,p=path.getPoint(t),orientation=random(ornament+column*3+row*19)*Math.PI*2;
        const kindRoll=random(row*701+column*37+ornament*11),materialIndex=(ornament+row+column)%4===0?1:0;
        if(kindRoll<.48){
          const size=.72+.56*random(row+column+ornament*5);
          record('leaf',materialIndex,p.toArray(),[.18*Math.sin(orientation),orientation,.16*Math.cos(orientation)],[.012*size,.034*size,.006*size]);
        }else if(kindRoll<.79){
          const size=.50+.45*random(row+column*2+ornament*7);
          record('flower',materialIndex,p.toArray(),[.06*Math.sin(orientation),0,orientation],[size,size,size]);
        }else{
          const size=.68+.56*random(row+column*5+ornament*3);
          record('crown',materialIndex,p.toArray(),[.10*Math.sin(orientation),orientation,.08*Math.cos(orientation)],[size,size,size]);
        }
      }
      const terminal=path.getPoint(1);
      record('bell',jitter>.53?0:1,[terminal.x,endY-.038,terminal.z],[.05*Math.sin(column),orientationFor(row,column),.07*Math.cos(row+column)],[.82+.20*random(column+row),.82+.20*random(row+column),.82+.20*random(column-row)]);
    }
  }

  const pair=[gold,oldgold];
  emitInstances('eyelet',eyeletGeometry,pair,'beam-eyelet');
  emitInstances('link',linkGeometry,pair,'organic-chain-link');
  emitInstances('leaf',leaf,pair,'leaf-bead');
  emitInstances('flower',flower,pair,'five-petal-flower-bead');
  emitInstances('crown',crown,pair,'small-crown-bead');
  emitInstances('bell',bell,pair,'terminal-bell');
  root.userData.chainStrands=strandCount;
  root.userData.instancedFloralDrops=beadCount;
  root.userData.centerFaceClearanceMeters=faceClearance;
  root.updateMatrixWorld(true);
  return root;
}

function orientationFor(row,column){return .025*Math.sin(row*1.7+column*.8);}
