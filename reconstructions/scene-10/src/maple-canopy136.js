import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const MAPLE_CANOPY136_REVISION='scene10-palmate-autumn-maple136';

export function createPalmateMapleLeaf136(){
  const shape=new T.Shape(),angles=[-143,-96,-48,0,48,96,143],radii=[.58,.82,1.0,1.14,1.0,.82,.58],outline=[[0,-.45]];
  const polar=(a,r)=>[Math.sin(a*Math.PI/180)*r,Math.cos(a*Math.PI/180)*r];
  for(let k=0;k<angles.length;k++){
    const angle=angles[k],tip=polar(angle,radii[k]),left=polar(angle-19,k===0?.22:.25),right=polar(angle+19,k===angles.length-1?.22:.25);
    outline.push(left);
    for(const f of[.22,.43,.65,.82]){
      const x=left[0]+(tip[0]-left[0])*f,y=left[1]+(tip[1]-left[1])*f,dx=tip[0]-left[0],dy=tip[1]-left[1],len=Math.hypot(dx,dy),tooth=(f===.43||f===.82)?.026:-.007;
      outline.push([x-dy/len*tooth,y+dx/len*tooth]);
    }
    outline.push(tip);
    for(const f of[.18,.35,.57,.78]){
      const x=tip[0]+(right[0]-tip[0])*f,y=tip[1]+(right[1]-tip[1])*f,dx=right[0]-tip[0],dy=right[1]-tip[1],len=Math.hypot(dx,dy),tooth=(f===.18||f===.57)?.025:-.007;
      outline.push([x-dy/len*tooth,y+dx/len*tooth]);
    }
    outline.push(right);
  }
  outline.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();
  const leaf=new T.ShapeGeometry(shape,12),p=leaf.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),radius=Math.min(1,Math.hypot(x/.90,(y-.12)/.92));
    p.setZ(i,.015+.070*(1-radius)+.018*Math.sin(x*8.7+y*5.1));
  }
  leaf.computeVertexNormals();leaf.name='cupped-seven-lobe-red-maple-lamina';
  const paths=[
    [[0,-.53,.025],[0,-.28,.068],[0,.02,.080],[0,.48,.070],[0,1.00,.026]],
    [[0,-.06,.078],[-.18,.09,.092],[-.48,.23,.061],[-.79,.36,.030]],
    [[0,-.04,.078],[.18,.09,.092],[.48,.23,.061],[.79,.36,.030]],
    [[0,.06,.078],[-.13,.26,.093],[-.24,.53,.061],[-.22,.91,.028]],
    [[0,.06,.078],[.13,.26,.093],[.24,.53,.061],[.22,.91,.028]],
    [[0,-.12,.075],[-.18,-.06,.088],[-.38,-.14,.058],[-.53,-.33,.027]],
    [[0,-.12,.075],[.18,-.06,.088],[.38,-.14,.058],[.53,-.33,.027]]
  ];
  const veinParts=paths.map(points=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q))),18,.0055,5,false));
  const veins=mergeGeometries(veinParts,false);for(const g of veinParts)g.dispose();veins.name='raised-palmate-red-maple-veins-and-petiole';
  return{leaf,veins};
}

export function buildMatureMapleCanopy136({branch,emit,leafGeometry,veinGeometry,palette,veinMaterial,position=[6.7,-.1,3],seed=136031}){
  let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const add=(a,b,r)=>branch(a,b,r,'mapleBark'),origin=new T.Vector3(...position),leafAxis=new T.Vector3(0,1,0);
  const at=(dx,dy,dz)=>[origin.x+dx,origin.y+dy,origin.z+dz];
  const trunk=[at(0,0,0),at(-.08,2.15,.16),at(.12,4.25,.05),at(.38,6.35,-.23),at(.74,8.15,-.47)];
  const trunkRadii=[.14,.115,.085,.060];
  for(let i=0;i<trunk.length-1;i++)add(trunk[i],trunk[i+1],trunkRadii[i]);
  let terminalBranches=0,leafInstances=0;
  function addLeaf(point,direction,size){
    const outward=new T.Vector3(...direction).normalize(),q=new T.Quaternion().setFromUnitVectors(leafAxis,outward);
    q.multiply(new T.Quaternion().setFromAxisAngle(leafAxis,(rand()-.5)*Math.PI*1.8));
    q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),(rand()-.5)*.72));
    const dx=(rand()-.5)*.20,dy=(rand()-.5)*.18,dz=(rand()-.5)*.22,x=point[0]+dx,y=point[1]+dy,z=point[2]+dz;
    const scale=size*(.82+.36*rand()),material=palette[Math.floor(rand()*palette.length)],tint=.83+.32*rand();
    emit(leafGeometry,material,x,y,z,scale,scale,scale,q,tint);
    emit(veinGeometry,veinMaterial,x,y,z,scale,scale,scale,q,tint);leafInstances++;
  }
  function grow(start,direction,length,radius,depth){
    const d=new T.Vector3(...direction).normalize(),wander=new T.Vector3((rand()-.5)*.24,(rand()-.5)*.16,(rand()-.5)*.24);
    const end=new T.Vector3(...start).addScaledVector(d,length).add(wander),mid=new T.Vector3(...start).lerp(end,.57).add(wander.clone().multiplyScalar(.35));
    add(start,mid.toArray(),radius);add(mid.toArray(),end.toArray(),radius*.70);
    if(depth===0){
      terminalBranches++;
      for(const t of[.54,.76,1.0]){
        const center=new T.Vector3(...start).lerp(end,t),bundle=t===1?9:4;
        for(let i=0;i<bundle;i++){
          const p=center.clone().add(new T.Vector3((rand()-.5)*.42,(rand()-.5)*.30,(rand()-.5)*.42));
          const spread=new T.Vector3(d.x+(rand()-.5)*.95,d.y+(rand()-.5)*.75,d.z+(rand()-.5)*.95);
          addLeaf(p.toArray(),spread,.15+.065*rand());
        }
      }
      return;
    }
    const side=new T.Vector3(-d.z,0,d.x).normalize(),count=3;
    for(let i=0;i<count;i++){
      const turn=(i-(count-1)/2)*.72+(rand()-.5)*.32;
      const child=side.clone().multiplyScalar(Math.sin(turn)).add(d.clone().multiplyScalar(.46)).add(new T.Vector3(0,.45+rand()*.30,0));child.x=Math.max(.12,child.x);
      grow(end.toArray(),child.toArray(),length*(.58+.11*rand()),radius*.55,depth-1);
    }
  }
  const leaders=[
    {y:5.0,d:[.12,.65,-.20],l:2.8,r:.090},{y:5.45,d:[1,.48,.12],l:3.5,r:.085},
    {y:6.05,d:[.08,.68,.55],l:2.8,r:.080},{y:6.45,d:[.72,.57,-.38],l:3.3,r:.078},
    {y:7.05,d:[.18,.78,.55],l:2.8,r:.070},{y:7.45,d:[1,.58,.24],l:3.2,r:.068},
    {y:7.85,d:[.10,.80,-.52],l:2.6,r:.058}
  ];
  for(const b of leaders)grow(at(.1,b.y,-.08),b.d,b.l,b.r,3);
  return{revision:MAPLE_CANOPY136_REVISION,position,primaryBranches:leaders.length,terminalBranches,leafInstances,leafForm:'cupped seven-lobe lamina, raised central and lateral veins, exposed petiole',palette:palette.map(m=>m.name)};
}
