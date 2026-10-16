import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Reference 6, sculpture only. +Z faces the viewer. Coordinates deliberately
// use a normalized seat-contact origin (Y=0); crown Y=3.26.
// Lotus/throne geometry is deliberately excluded; the altar module owns it.
// No lighting, halo, podium, scene, or camera is created by this module.
const TAU = Math.PI * 2;
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const gaussian = (x, s) => Math.exp(-((x / s) ** 2));
const cache = new Map();

function surface(nu, nv, fn, closedU = false) {
  const positions = [], uv = [], ids = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = fn(i / nu, j / nv); positions.push(...p); uv.push(i / nu, j / nv);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    ids.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(ids); g.computeVertexNormals();
  if (closedU) {
    const n = g.attributes.normal;
    for (let j = 0; j <= nv; j++) {
      const a = j * (nu + 1), b = a + nu;
      const v = new T.Vector3(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
      n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
    }
  }
  return g;
}
function ellipse(x, y, z, rx, ry, rz, segments = 32, rings = 24) {
  return new T.SphereGeometry(1, segments, rings).scale(rx, ry, rz).translate(x, y, z);
}
function curve(points) { return new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal'); }
function tube(points, radius, segments = 36, radial = 8) {
  return new T.TubeGeometry(curve(points), segments, radius, radial, false);
}
// Anatomical/sleeve sweep with elliptical sections, a taper and non-periodic
// compression wrinkles. Unlike the old blobs it follows the actual arm axis.
function swept(points, width, depth, {segments = 70, radial = 32, taper = null, wrinkle = null} = {}) {
  const c = curve(points), frames = c.computeFrenetFrames(segments, false);
  return surface(radial, segments, (u, v) => {
    const a = u * TAU, k = Math.min(segments, Math.round(v * segments));
    const p = c.getPointAt(v), n = frames.normals[k], b = frames.binormals[k];
    let s = taper ? taper(v) : Math.pow(Math.sin(Math.PI * v), .32);
    const relief = wrinkle ? wrinkle(v, a) : 0;
    p.addScaledVector(n, Math.cos(a) * (width * s + relief));
    p.addScaledVector(b, Math.sin(a) * (depth * s + relief * .65));
    return p.toArray();
  }, true);
}
function sampleProfile(rows, y) {
  let k = 0; while (k < rows.length - 2 && y > rows[k + 1][0]) k++;
  const a = rows[k], b = rows[k + 1], p = rows[Math.max(0,k-1)], q = rows[Math.min(rows.length-1,k+2)];
  const t = clamp((y-a[0])/(b[0]-a[0]),0,1), h=b[0]-a[0];
  return a.slice(1).map((v,i)=>{const n=i+1, m0=(b[n]-p[n])/(b[0]-p[0]), m1=(q[n]-a[n])/(q[0]-a[0]);return (2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[n]+(t*t*t-t*t)*h*m1;});
}
function torso() {
  const rows = [[2.00,.42,.23,.06],[2.17,.67,.39,.04],[2.42,.59,.41,.015],[2.78,.56,.39,-.005],[3.12,.62,.37,-.02],[3.38,.68,.325,-.035],[3.52,.52,.27,-.035],[3.66,.225,.205,-.035],[3.84,.208,.195,-.035]];
  return surface(160, 180, (u, v) => {
    const y = 2 + 1.84 * v, a = u * TAU, [rx, rz, cz] = sampleProfile(rows, y);
    const x = Math.sin(a) * rx, front = Math.max(0, Math.cos(a));
    let z = cz + Math.cos(a) * rz;
    let folds = 0;
    // Carved nested U folds lie in the garment itself; no floating wire ribs.
    for (let j = 0; j < 12; j++) {
      const h = 2.23 + j * .085 + .012*Math.sin(j*1.9) + (.29+.035*Math.sin(j)) * ((x - .11) / .70) ** 2 + (.12+j*.009) * x;
      const weight = smooth(y, 2.12, 2.28) * (1 - smooth(y, 3.40, 3.56));
      folds += weight * (.013 * gaussian(y - h, .020+.002*Math.sin(j)) - .0045 * gaussian(y - h + .031, .017));
    }
    // Narrow vertical border falls from the figure's covered left shoulder.
    const edge = .41 - .045 * (3.5 - y) + .025 * Math.sin(y * 3);
    folds += .026 * gaussian(x - edge, .032) * smooth(y, 2.15, 2.5) * (1 - smooth(y, 3.45, 3.57));
    folds -= .010 * gaussian(x - edge - .047, .018) * (1 - smooth(y, 3.40, 3.6));
    if (y > 3.61) folds += .004 * Math.cos((y - 3.62) * 110) * (1 - smooth(y, 3.76, 3.82));
    z += folds * front ** 3;
    return [x, y, z];
  }, true);
}
function head() {
  const g = new T.SphereGeometry(1, 144, 112), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i), ny = p.getY(i), nz = p.getZ(i);
    let x = nx * .375 * (1 - .10 * smooth(-ny, .35, 1));
    const y = 4.215 + ny * .468;
    let z = -.018 + nz * .316;
    const G = (cx, cy, sx, sy) => gaussian(x - cx, sx) * gaussian(y - cy, sy);
    if (nz > 0) {
      let r = .035 * G(-.205,4.12,.14,.16) + .035 * G(.205,4.12,.14,.16);
      r += .057 * G(0,4.24,.043,.16) + .104 * G(0,4.105,.057,.055);
      r += .025 * G(-.060,4.079,.033,.030) + .025 * G(.060,4.079,.033,.030);
      r -= .019 * G(-.046,4.068,.015,.012) + .019 * G(.046,4.068,.015,.012);
      r -= .012 * G(0,4.031,.020,.027);
      for (const side of [-1, 1]) {
        const ex = side * x, arch = Math.max(0,1-((ex-.157)/.126)**2);
        const eyelid = 4.256 + .016 * arch + .016 * (ex-.15);
        const brow = 4.335 + .036 * arch;
        const mask = smooth(ex,.033,.065)*(1-smooth(ex,.266,.300));
        r -= .023 * G(side*.163,4.284,.126,.059);
        r += mask * (.021*gaussian(y-brow,.020)+.014*gaussian(y-eyelid-.010,.013));
        r -= mask * .013*gaussian(y-eyelid,.006);
        r += mask * .009*gaussian(y-eyelid+.019,.014);
      }
      const mouth = 3.984 + .018*(x/.13)**2;
      const ml = gaussian(x,.128);
      r += ml*(.016*gaussian(y-mouth-.015,.013)+.022*gaussian(y-mouth+.018,.018));
      r -= ml*.013*gaussian(y-mouth,.0045);
      r += .032 * G(0,3.889,.146,.065);
      z += r * nz ** .45;
    }
    p.setXYZ(i,x,y,z);
  }
  g.computeVertexNormals(); return g;
}
function ear(side) {
  // A lobed outline, open concha and elongated lower lobe, not a detached ball.
  return surface(48,70,(u,v)=>{
    const a=u*TAU,y=3.80+v*.65, taper=Math.pow(Math.sin(Math.PI*v),.38);
    const width=(.028+.026*Math.sin(Math.PI*v)+.017*gaussian(v-.15,.17))*taper;
    const cx=side*(.348+.050*Math.sin(v*Math.PI));
    const x=cx+Math.sin(a)*width;
    let z=-.004+Math.cos(a)*(.050+.020*Math.sin(Math.PI*v))*taper;
    if(Math.cos(a)>0) z-=.043*gaussian(v-.56,.27)*Math.cos(a)**4*taper;
    return [x,y,z];
  },true);
}
function finger(points,r=.024) {
  return swept(points,r,r*.90,{segments:30,radial:14,taper:t=>.82+.18*Math.sin(t*Math.PI)-.73*smooth(t,.84,1)});
}
function palm(raised=true) {
  const g = new T.SphereGeometry(1,40,30),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i);
    if(raised){
      const y=3.105+ny*.162,x=-.595+nx*.105*(.88+.12*ny),z=.555+nz*.050;
      p.setXYZ(i,x,y,z+.007*Math.sin(ny*6)*Math.max(0,nz));
    }else p.setXYZ(i,.095+nx*.205,2.297+ny*.046,.645+nz*.111);
  }
  g.computeVertexNormals();return g;
}
function buildAsset() {
  const parts={buddha:[],oldgold:[],gold:[]};
  const add=(g,material='buddha')=>parts[material].push(g);
  add(torso());add(head());
  for(const s of [-1,1])add(ear(s));
  // Shoulder/sleeve lines follow the image's low elbows and inward wrists.
  const sleeves=[
    [[-.40,3.38,-.025],[-.70,3.26,.025],[-.93,2.91,.105],[-.94,2.57,.20],[-.76,2.73,.36],[-.60,2.965,.54]],
    [[.40,3.38,-.025],[.70,3.25,.015],[.93,2.91,.10],[.92,2.58,.25],[.65,2.36,.45],[.29,2.29,.61]]
  ];
  for(const ps of sleeves) add(swept(ps,.206,.171,{segments:110,radial:48,taper:t=>(.75+.25*Math.sin(Math.PI*t)-.30*smooth(t,.76,1))*(.35+.65*smooth(t,0,.09)),wrinkle:(t,a)=>{
    let w=0;for(let j=0;j<8;j++){const at=.20+j*.083+.026*Math.cos(a);w+=.006*gaussian(t-at,.014)-.003*gaussian(t-at-.022,.016);}return w*Math.sin(Math.PI*t);
  }}));
  // Wide crossed shins form one continuous seat silhouette, with the two
  // diagonal sweeps visibly overlapping rather than two identical knee balls.
  add(swept([[-.38,2.20,.02],[-.93,2.22,.16],[-1.38,2.12,.36],[-1.31,1.99,.54],[-.76,1.95,.73],[.02,1.98,.75],[.53,2.10,.56]].map(p=>[p[0],p[1]-.084,p[2]]),.31,.17,{segments:140,radial:52,taper:t=>Math.pow(Math.sin(Math.PI*t),.24),wrinkle:(t,a)=>.012*Math.cos(27*t+1.6*Math.sin(a))*Math.sin(Math.PI*t)**2}));
  add(swept([[.39,2.21,.01],[.98,2.22,.14],[1.39,2.12,.32],[1.31,1.985,.57],[.69,2.01,.78],[-.02,2.06,.74],[-.51,2.14,.53]].map(p=>[p[0],p[1]-.084,p[2]]),.30,.16,{segments:140,radial:52,taper:t=>Math.pow(Math.sin(Math.PI*t),.24),wrinkle:(t,a)=>.011*Math.cos(25*t+1.2*Math.sin(a))*Math.sin(Math.PI*t)**2}));
  // Upper thigh volumes fill the lap behind the crossed shins. These shallow
  // cloth surfaces remove the hollow torus silhouette without swelling knees.
  for(const side of [-1,1]){
    const thigh=ellipse(side*.77,2.04,.30,.68,.17,.49,72,48), p=thigh.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const upper=smooth(y,2.02,2.16);p.setY(i,y+upper*(.007*Math.sin(z*38+side*x*5)+.006*gaussian(z-.39,.035)));}
    thigh.computeVertexNormals();add(thigh);
  }
  // Hem between crossed shins is a shallow fluted garment tongue.
  add(surface(44,58,(u,v)=>{const x=(u*2-1)*(.24-.06*v),y=1.80+v*.50;return[x,y,.72+.009*Math.cos(x*62)+.025*Math.sin(v*5)-.035*u*u];}));
  add(palm(true));add(palm(false));
  // Raised anatomical right hand: slender individually tapering fingers,
  // gently separated, with index and thumb curling into the reference mudra.
  const fingers=[
    [[-.660,3.19,.558],[-.685,3.30,.563],[-.691,3.382,.550]],
    [[-.611,3.225,.565],[-.620,3.354,.570],[-.616,3.445,.552]],
    [[-.566,3.23,.565],[-.566,3.361,.562],[-.555,3.431,.540]],
    [[-.524,3.20,.555],[-.503,3.30,.565],[-.491,3.363,.539]],
    [[-.507,3.065,.574],[-.452,3.139,.602],[-.475,3.223,.591]]
  ];
  fingers.forEach((p,i)=>add(finger(p,i===4?.027:.022)));
  // Palm-up hand lies across the lap, with four individually defined digits.
  for(let i=0;i<4;i++)add(finger([[.06-i*.024,2.315,.586+i*.052],[-.11,2.325,.59+i*.047],[-.25+.016*i,2.306,.60+i*.043]],.019));
  add(finger([[.20,2.307,.566],[.12,2.357,.563],[.03,2.356,.595]],.024));
  // Engraved palm lines: shallow gold recesses, not black drawn strokes.
  add(tube([[-.65,3.105,.605],[-.60,3.093,.610],[-.55,3.109,.601]],.0024,24,6),'oldgold');
  add(tube([[-.642,3.155,.605],[-.60,3.171,.609],[-.548,3.168,.601]],.0021,24,6),'oldgold');
  // Crown curls are small tightly packed rounded curls, confined above hairline.
  add(new T.SphereGeometry(1,64,40,0,TAU,0,Math.PI/2).scale(.340,.245,.290).translate(0,4.50,-.025),'oldgold');
  add(ellipse(0,4.735,-.025,.145,.115,.143,40,30),'oldgold');
  for(let row=0;row<9;row++){
    const y=4.50+row*.027,rr=.340*Math.sqrt(Math.max(.025,1-((y-4.50)/.245)**2))+.009;
    const count=Math.max(10,Math.round(TAU*rr/.045));
    for(let i=0;i<count;i++){const a=i/count*TAU+(row%2)*Math.PI/count;
      add(ellipse(Math.sin(a)*rr,y,-.025+Math.cos(a)*rr*.83,.023,.022,.021,12,10),'oldgold');
    }
  }
  for(let row=0;row<4;row++){const yy=4.70+row*.029,rr=.141*Math.sqrt(Math.max(.035,1-((yy-4.72)/.113)**2));const n=Math.max(7,Math.round(TAU*rr/.042));for(let i=0;i<n;i++){const a=TAU*i/n;add(ellipse(Math.sin(a)*rr,yy,-.025+Math.cos(a)*rr,.022,.021,.020,12,10),'oldgold');}}
  add(ellipse(0,4.857,-.025,.040,.053,.040,24,18),'buddha');
  add(ellipse(0,4.405,.287,.017,.017,.010,20,14),'gold');
  // Merged by finish: three draw calls for the entire sculpture, shared by triad.
  const result=[];
  for(const [material,geos] of Object.entries(parts)){
    if(!geos.length)continue;
    const g=mergeGeometries(geos,false);g.translate(0,-1.65,0);g.computeBoundingBox();g.computeBoundingSphere();g.name=`reference6-buddha-${material}`;
    result.push({geometry:g,material});geos.forEach(x=>x.dispose());
  }
  return result;
}

export const RESTORED_BUDDHA_METRICS = Object.freeze({
  reference:6,frontAxis:'+Z',seatContact:0,headCenter:2.565,crownTop:3.26,
  raisedHandTop:1.795,kneeWidth:3.186,bodyDepth:1.44,
  referenceFit:{central:{x:0,y:3,z:0,scale:.63},attendantRelativeScale:.69},
  materials:{buddha:{color:'#cfaa5d',metalness:.94,roughness:.29},oldgold:{color:'#927036',metalness:.91,roughness:.37},gold:{color:'#d1ab58',metalness:.95,roughness:.27}}
});
export function restoredBuddhaParts() {
  if(!cache.has('reference6'))cache.set('reference6',buildAsset());
  return cache.get('reference6');
}
/** Integrates directly into world's instance(geometry, material, x,y,z,sx,sy,sz). */
export function emitRestoredBuddha(instance,{x=0,y=0,z=0,scale=1}={}) {
  for(const p of restoredBuddhaParts())instance(p.geometry,p.material,x,y,z,scale,scale,scale);
}
/** Standalone scene API: coordinates above remain local to the returned group. */
export function createRestoredBuddha({materials={},x=0,y=0,z=0,scale=1}={}) {
  const defaults={
    buddha:new T.MeshStandardMaterial({name:'buddha',color:'#cfaa5d',metalness:.94,roughness:.29}),
    oldgold:new T.MeshStandardMaterial({name:'oldgold',color:'#927036',metalness:.91,roughness:.37}),
    gold:new T.MeshStandardMaterial({name:'gold',color:'#d1ab58',metalness:.95,roughness:.27})
  };
  const group=new T.Group();group.name='reference6-restored-buddha';group.position.set(x,y,z);group.scale.setScalar(scale);
  for(const p of restoredBuddhaParts()){const mesh=new T.Mesh(p.geometry,materials[p.material]||defaults[p.material]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=p.geometry.name;group.add(mesh);}
  return group;
}
