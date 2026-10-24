import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {foliageNormalMaterial} from './botany.js';

// Complete isolated form candidate for two EXISTING garden pines. No new tree,
// ground, camera, texture, light or source-material replacement is introduced.
// The other old pine (-7,-4) remains outside this candidate: its original root
// ring lies inside the main-hall stone foundation and is not silently moved.
export const RESTORATION_PRUNED_PINE_SCOPE=Object.freeze([
  Object.freeze({id:'east-island-existing-pine',oldCall:Object.freeze([12,3,5.2,'pine','leafDark',-.4]),islandIndex:1,worldRoot:Object.freeze([2.059273238,-.12,1.284909604])}),
  Object.freeze({id:'west-island-existing-pine',oldCall:Object.freeze([-18,5,6.5,'pine','leafDark',1.2]),islandIndex:2,worldRoot:Object.freeze([-15.940726762,-.12,2.484909604])})
]);
const TAU=Math.PI*2,vec=p=>new T.Vector3(...p),rng=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);

// Each timber piece is independently closed, with nonzero-radius end disks.
// Intersecting branch unions are not falsely advertised as one Boolean mesh.
function closedSweep(points,radius,segments,radial=8,tipRatio=.22){
  const curve=new T.CatmullRomCurve3(points.map(vec)),frames=curve.computeFrenetFrames(segments,false),p=[],uv=[],ids=[],centres=[],radii=[];
  const length=curve.getLength();
  for(let j=0;j<=segments;j++){
    const t=j/segments,c=curve.getPointAt(t),r=radius*(tipRatio+(1-tipRatio)*Math.pow(1-t,.8));centres.push(c);radii.push(r);
    for(let k=0;k<=radial;k++){
      const a=(k===radial?0:k/radial)*TAU,n=frames.normals[j].clone().multiplyScalar(-Math.cos(a)).addScaledVector(frames.binormals[j],Math.sin(a)),v=c.clone().addScaledVector(n,r);
      p.push(v.x,v.y,v.z);uv.push(k/radial*TAU*radius,length*t);
      if(j<segments&&k<radial){const q=j*(radial+1)+k;ids.push(q,q+radial+1,q+1,q+1,q+radial+1,q+radial+2);}
    }
  }
  const sideVertices=p.length/3;
  for(const end of[0,segments]){
    const centreIndex=p.length/3,c=centres[end],normal=frames.tangents[end].clone().multiplyScalar(end===0?-1:1);p.push(c.x,c.y,c.z);uv.push(.5,.5);const ring=p.length/3;
    for(let k=0;k<radial;k++){const source=(end*(radial+1)+k)*3;p.push(p[source],p[source+1],p[source+2]);uv.push(.5+.5*Math.cos(k/radial*TAU),.5+.5*Math.sin(k/radial*TAU));}
    for(let k=0;k<radial;k++){
      let a=ring+k,b=ring+(k+1)%radial;
      const cross=vec(p.slice(a*3,a*3+3)).sub(c).cross(vec(p.slice(b*3,b*3+3)).sub(c));if(cross.dot(normal)<0)[a,b]=[b,a];ids.push(centreIndex,a,b);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();
  // Close the periodic normal seam without welding away its UV chart boundary.
  const n=g.attributes.normal;for(let j=0;j<=segments;j++){const a=j*(radial+1),b=a+radial,v=new T.Vector3().fromBufferAttribute(n,a).add(new T.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}
  // End disks are flat. Their separate vertices do not round the exposed ends.
  for(let i=sideVertices,end=0;end<2;end++){const v=frames.tangents[end?segments:0].clone().multiplyScalar(end?1:-1);for(let k=0;k<=radial;k++,i++)n.setXYZ(i,v.x,v.y,v.z);}
  return {geometry:g,curve,centres,radii,segments,radial,sideVertices,radius,tipRatio};
}

export function buildRestorationPrunedPine({materials,needleGeometry,options={}}={}){
  const plan=RESTORATION_PRUNED_PINE_SCOPE.find(p=>p.id===options.id);if(!plan)throw Error('Select one of the two explicitly retained garden pines.');
  if(!materials?.bark?.isMaterial||!materials?.needleGreen?.isMaterial||!needleGeometry?.isBufferGeometry)throw Error('Actual borrowed bark, needle material and needle card are required.');
  const h=plan.oldCall[2],lean=plan.oldCall[5],random=rng(options.seed??(plan.islandIndex===1?620178:620279)),rr=(a,b)=>a+(b-a)*random();
  const group=new T.Group();group.name=plan.id+'-pruned-form-candidate';const owned=new Set(),pieces=[],attachments=[],pads=[],cardMatrices=[],cardShades=[],dummy=new T.Object3D();let normalMaterial=null,foliage=null,normal=null,disposed=false;
  function wood(points,radius,segments,radial=8,tipRatio=.22,parent=null,parentRing=null,role='branch'){
    const s=closedSweep(points,radius,segments,radial,tipRatio);owned.add(s.geometry);s.id=pieces.length;s.role=role;pieces.push(s);
    if(parent){attachments.push({child:s.id,parent:parent.id,parentRing,childRoot:[...points[0]],actualParentRingCentre:parent.centres[parentRing].toArray(),parentRadius:parent.radii[parentRing],childRadius:radius});}
    return s;
  }
  try{
    // An S-curved trunk and irregular near-horizontal bough tiers replace the
    // old ascending maple-like scaffold. This is a form hypothesis, not a scan.
    const trunk=wood([[0,0,0],[lean*.28,h*.18,h*.018],[lean*.78,h*.43,-h*.022],[lean*.46,h*.68,h*.014],[lean*.65,h*.94,0]],h*.032,40,10,.16,null,null,'trunk');
    const rings=[8,13,19,25,31,37];
    for(let tier=0;tier<6;tier++){
     for(let arm=0;arm<(tier%3===1?3:2);arm++){
      const ring=Math.min(39,rings[tier]+(arm===0?0:arm===1?(tier%2?2:-1):1)),base=trunk.centres[ring].clone(),az=-Math.PI/2+(arm===0?1.12:arm===1?-1.12:Math.PI*.90)+.20*Math.sin(tier*1.7+arm*.8),reach=h*(.285-.021*tier)*(arm===2?.73:.83+.20*(.5+.5*Math.sin(tier*1.31+arm*2.3))),dir=new T.Vector3(Math.cos(az),0,Math.sin(az)),end=base.clone().addScaledVector(dir,reach);end.y+=h*(-.006+.048*(.5+.5*Math.sin(tier*1.63+arm*2.1)));
      const middle=base.clone().lerp(end,.52);middle.y-=h*.014;
      const primary=wood([base.toArray(),middle.toArray(),end.toArray()],trunk.radii[ring]*.44,16,8,.25,trunk,ring,'primary-horizontal-bough');
      for(let fan=0;fan<3;fan++){
        const parentRing=[9,12,15][fan],start=primary.centres[parentRing].clone(),angle=az+(fan-1)*.68,extent=h*(.085-.0055*tier),tip=start.clone().add(new T.Vector3(Math.cos(angle)*extent,h*.010,Math.sin(angle)*extent)),mid=start.clone().lerp(tip,.53);mid.y+=h*.009;
        const secondary=wood([start.toArray(),mid.toArray(),tip.toArray()],primary.radii[parentRing]*.43,10,6,.32,primary,parentRing,'fan-bearing-branchlet');
        const pad={tier,arm,fan,anchor:tip.toArray(),spurs:[],cards:0};pads.push(pad);
        for(let spur=0;spur<8;spur++){
          const parentRing=3+spur%7,root=secondary.centres[parentRing].clone(),spread=h*(.072-.0023*tier),a=angle+(spur-3.5)*.19,reach=spread*(.66+.34*Math.sin((spur+1)/9*Math.PI)),finish=root.clone().add(new T.Vector3(Math.cos(a)*reach,h*(.005+.004*Math.sin(spur)),Math.sin(a)*reach)),mid=root.clone().lerp(finish,.53);mid.y+=h*.006;
          const twig=wood([root.toArray(),mid.toArray(),finish.toArray()],secondary.radii[parentRing]*.41,6,5,.38,secondary,parentRing,'needle-bearing-spur');pad.spurs.push(twig.id);
          const count=spur<6?24:23; // 190 twig-attached cards per fan;18 fans across six irregular tiers.
          for(let k=0;k<count;k++){
            const t=.16+.82*(k+.5)/count,anchor=twig.curve.getPointAt(t),size=rr(.20,.36),yaw=a+(k%2?1:-1)*rr(.38,.95)+rr(-.12,.12),pitch=rr(-.17,.17),roll=rr(-.16,.16);
            dummy.rotation.set(pitch,yaw,roll);dummy.scale.set(size,1,size);
            // Inherited needle atlas stem begins near canvas(256,470). Position
            // that authored card-base proxy on the real twig, not in a cloud.
            const baseOffset=new T.Vector3(0,0,(470/512-.5)*size).applyEuler(dummy.rotation);dummy.position.copy(anchor).sub(baseOffset);dummy.updateMatrix();cardMatrices.push(dummy.matrix.clone());cardShades.push(rr(.74,1.25));pad.cards++;
          }
        }
      }
     }
    }
    const geometry=mergeGeometries(pieces.map(p=>p.geometry));if(!geometry)throw Error('Pruned pine timber merge failed.');owned.add(geometry);
    const woodMesh=new T.Mesh(geometry,materials.bark);woodMesh.name='connected-pruned-pine-trunk-and-fan-boughs';woodMesh.castShadow=woodMesh.receiveShadow=true;group.add(woodMesh);
    foliage=new T.InstancedMesh(needleGeometry,materials.needleGreen,cardMatrices.length);const color=new T.Color();foliage.name='existing-pine-needle-cards-on-layered-fans';cardMatrices.forEach((m,i)=>{foliage.setMatrixAt(i,m);foliage.setColorAt(i,color.setRGB(cardShades[i],cardShades[i],cardShades[i]));});foliage.instanceMatrix.needsUpdate=true;foliage.instanceColor.needsUpdate=true;foliage.castShadow=foliage.receiveShadow=true;foliage.computeBoundingSphere();group.add(foliage);
    group.updateMatrixWorld(true);normalMaterial=foliageNormalMaterial(materials.needleGreen);normal=new T.InstancedMesh(needleGeometry,normalMaterial,foliage.count);normal.name=plan.id+'-needle-alpha-normal';normal.instanceMatrix=foliage.instanceMatrix;normal.instanceColor=foliage.instanceColor;normal.matrix.copy(foliage.matrixWorld);normal.matrixAutoUpdate=false;normal.boundingSphere=foliage.boundingSphere;
    const bounds=new T.Box3().setFromObject(group),pieceMetadata=pieces.map(p=>({id:p.id,role:p.role,segments:p.segments,radial:p.radial,radius:p.radius,tipRatio:p.tipRatio,geometry:p.geometry}));
    const result={group,woodMesh,foliageMesh:foliage,foliageMeshes:[foliage],normalMeshes:[normal],materials:{bark:materials.bark,needleGreen:materials.needleGreen},attachments,pads,pieces:pieceMetadata,bounds,
      stats:{version:'scene04-212-offset-height-asymmetric-pine-boughs-r18',meshes:2,needleCards:foliage.count,timberComponents:pieces.length,timberTriangles:(geometry.index?.count??geometry.attributes.position.count)/3},
      placement:{...plan,sourceUnits:true,applyOriginalTreeStackExactlyOnce:true,sourceWorldRngDraws:0,preserveOldRootDressingRocks:true,originalYawMustBeBorrowed:true,photoWindowIdentity:null,scope:'Macro form reconstruction only, preserving the two existing tree roots/nominal heights. Original photo4 supports layered fan crowns and readable curved boughs, not unique hidden branch angles or metric dimensions.'},
      syncNormalWorldMatrix(){group.updateMatrixWorld(true);normal.matrix.copy(foliage.matrixWorld);normal.matrixWorld.copy(normal.matrix);},
      dispose(){if(disposed)return;disposed=true;const errors=[];for(const f of[...owned].map(g=>()=>g.dispose()).concat([()=>foliage.dispose(),()=>normal.dispose(),()=>normalMaterial.dispose(),()=>normal.removeFromParent(),()=>group.removeFromParent()]))try{f();}catch(e){errors.push(e);}if(errors.length)throw new AggregateError(errors,'Pruned pine owned cleanup failures');}
    };
    // Component geometries remain owned/read-only for finite local topology and
    // attachment audits. They are not separately drawn; only merged wood draws.
    return result;
  }catch(error){const errors=[error];for(const g of owned)try{g.dispose();}catch(e){errors.push(e);}for(const resource of[foliage,normal,normalMaterial])if(resource)try{resource.dispose();}catch(e){errors.push(e);}try{group.removeFromParent();}catch(e){errors.push(e);}throw errors.length===1?error:new AggregateError(errors,'Pruned pine construction and cleanup failures');}
}
