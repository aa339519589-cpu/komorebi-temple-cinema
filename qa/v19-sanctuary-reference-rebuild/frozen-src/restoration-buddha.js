import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Reference 6, sculpture only. +Z faces the viewer. Coordinates deliberately
// use a normalized seat-contact origin (Y=0); crown Y=3.7765.
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
function swept(points, width, depth, {segments = 70, radial = 32, taper = null, wrinkle = null, vertical = false} = {}) {
  const c = curve(points), frames = c.computeFrenetFrames(segments, false);
  return surface(radial, segments, (u, v) => {
    const a = u * TAU, k = Math.min(segments, Math.round(v * segments));
    const p = c.getPointAt(v); let n = frames.normals[k], b = frames.binormals[k];
    if(vertical){const t=c.getTangentAt(v);n=new T.Vector3().crossVectors(new T.Vector3(0,1,0),t).normalize();b=new T.Vector3().crossVectors(t,n).normalize();}
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
const TORSO_PROFILE=[[2.00,.42,.23,.06],[2.17,.67,.39,.04],[2.42,.59,.41,.015],[2.78,.56,.39,-.005],[3.12,.62,.37,-.02],[3.38,.68,.325,-.035],[3.52,.52,.27,-.035],[3.66,.225,.205,-.035],[3.84,.208,.160,-.035]];
function clothFrontZ(x,y){const [rx,rz,cz]=sampleProfile(TORSO_PROFILE,y);return cz+rz*Math.sqrt(Math.max(.01,1-(x/rx)**2))+.014;}
function torso() {
  const rows = TORSO_PROFILE;
  return surface(160, 180, (u, v) => {
    const y = 2 + 1.84 * v, a = u * TAU, [rx, rz, cz] = sampleProfile(rows, y);
    const x = Math.sin(a) * rx, front = Math.max(0, Math.cos(a));
    let z = cz + Math.cos(a) * rz;
    let folds = 0;
    // Carved nested U folds lie in the garment itself; no floating wire ribs.
    for (let j = 0; j < 9; j++) {
      const h = 2.21 + j * .105 + .013*Math.sin(j*1.9) + (.65+.050*Math.sin(j)) * ((x + .085) / .70) ** 2 + (.12+j*.008) * x;
      const weight = smooth(y, 2.12, 2.28) * (1 - smooth(y, 3.40, 3.56));
      folds += weight * ((.014+.003*Math.sin(j*2.7)) * gaussian(y - h, .019+.002*Math.sin(j)) - .0035 * gaussian(y - h + .031, .019));
    }
    // Narrow vertical border falls from the figure's covered left shoulder.
    const edge = .41 - .045 * (3.5 - y) + .025 * Math.sin(y * 3);
    folds += .018 * gaussian(x - edge, .032) * smooth(y, 2.15, 2.5) * (1 - smooth(y, 3.45, 3.57));
    folds -= .010 * gaussian(x - edge - .047, .018) * (1 - smooth(y, 3.40, 3.6));
    const leftBorder=-.29-.16*Math.sin(clamp((3.6-y)/1.4,0,1)*Math.PI/2);
    const borderMask=smooth(y,2.12,2.38)*(1-smooth(y,3.55,3.64));
    folds+=borderMask*(.018*gaussian(x-leftBorder,.030)+.009*gaussian(x-leftBorder+.052,.020)-.006*gaussian(x-leftBorder+.028,.011));
    if (y > 3.61) folds += .004 * Math.cos((y - 3.62) * 110) * (1 - smooth(y, 3.76, 3.82));
    z += folds * front ** 3;
    return [x, y, z];
  }, true);
}
function head() {
  const g = new T.SphereGeometry(1, 144, 112), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i), ny = p.getY(i), nz = p.getZ(i);
    let x = nx * .390 * (1 - .10 * smooth(-ny, .35, 1));
    const y = 4.215 + ny * .440;
    let z = -.018 + nz * .316;
    const G = (cx, cy, sx, sy) => gaussian(x - cx, sx) * gaussian(y - cy, sy);
    if (nz > 0) {
      let r = .026 * G(-.205,4.12,.14,.16) + .026 * G(.205,4.12,.14,.16);
      r += .045 * G(0,4.24,.043,.16) + .065 * G(0,4.105,.052,.049);
      r += .018 * G(-.058,4.079,.030,.027) + .018 * G(.058,4.079,.030,.027);
      r -= .012 * G(-.044,4.068,.014,.010) + .012 * G(.044,4.068,.014,.010);
      r -= .012 * G(0,4.031,.020,.027);
      for (const side of [-1, 1]) {
        const ex = side * x, arch = Math.max(0,1-((ex-.187)/.112)**2);
        const eyelid = 4.256 + .016 * arch + .016 * (ex-.15);
        const brow = 4.335 + .036 * arch;
        const mask = smooth(ex,.075,.105)*(1-smooth(ex,.285,.315));
        r -= .023 * G(side*.187,4.284,.108,.055);
        r += mask * (.021*gaussian(y-brow,.020)+.014*gaussian(y-eyelid-.010,.013));
        r -= mask * .013*gaussian(y-eyelid,.006);
        r += mask * .009*gaussian(y-eyelid+.019,.014);
      }
      const mouth = 3.984 + .005*(x/.105)**2;
      const ml = gaussian(x,.092);
      r += ml*(.012*gaussian(y-mouth-.012,.011)+.014*gaussian(y-mouth+.014,.014));
      r -= ml*.009*gaussian(y-mouth,.0045);
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
    const cx=side*(.375+.050*Math.sin(v*Math.PI));
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
function remapSculptureY(g, mapY) {
  const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,mapY(p.getY(i)));g.computeVertexNormals();return g;
}
function liftedTorsoY(y){
  const rows=[[2,0],[2.35,.02],[2.78,.10],[3.12,.20],[3.38,.36],[3.52,.32],[3.66,.28],[3.84,.25]];
  return y+sampleProfile(rows,y)[0];
}
function buildAsset() {
  const parts={buddha:[],oldgold:[],gold:[]};
  const add=(g,material='buddha')=>parts[material].push(g);
  const addCloth=(g,material='buddha')=>add(remapSculptureY(g,liftedTorsoY),material);
  const addHair=(g,material='oldgold')=>add(remapSculptureY(g,y=>4.75+(y-4.50)*1.65),material);
  addCloth(torso());add(head().translate(0,.25,0));
  addCloth(new T.CircleGeometry(1,48).rotateX(-Math.PI/2).scale(.208,1,.160).translate(0,3.84,-.035));
  for(const s of [-1,1])add(ear(s).translate(0,.25,0));
  // Shoulder/sleeve lines follow the image's low elbows and inward wrists.
  const sleeves=[
    [[-.40,3.74,-.025],[-.70,3.60,.025],[-.93,3.07,.105],[-.94,2.64,.20],[-.76,2.74,.36],[-.60,2.900,.54]],
    [[.40,3.74,-.025],[.70,3.59,.015],[.93,3.07,.10],[.92,2.64,.25],[.65,2.40,.45],[.29,2.33,.61]]
  ];
  for(const ps of sleeves) add(swept(ps,.206,.171,{segments:110,radial:48,taper:t=>(.75+.25*Math.sin(Math.PI*t)-.30*smooth(t,.76,1))*(.35+.65*smooth(t,0,.09)),wrinkle:(t,a)=>{
    let w=.009*Math.cos(6*a+7*t)*Math.sin(Math.PI*t);for(let j=0;j<5;j++){const at=.43+j*.078+.045*Math.cos(a);w+=.008*gaussian(t-at,.020)-.003*gaussian(t-at-.028,.018);}w+=.011*gaussian(t-.73,.19)*Math.cos(9*a+6*t);return w*Math.sin(Math.PI*t);
  }}));
  // The reference lap is two low, cloth-covered knees, not a swept torus.
  // Each closed loft has a broad upper thigh and a tapering outer knee. The
  // sagging diagonal folds are part of the continuous front cloth surface.
  for(const side of [-1,1]){
    const g=surface(112,128,(u,v)=>{
      const a=u*TAU,sn=Math.sin(a),cs=Math.cos(a),section=Math.sqrt(Math.max(0,Math.sin(Math.PI*(.12+.88*v))));
      const x=side*(.055+1.235*v),cy=1.88+.075*smooth(v,.48,1),cz=.605+.075*Math.sin(Math.PI*v);
      const ry=(.203+.039*gaussian(v-.76,.24))*section,rz=(.345+.026*Math.sin(Math.PI*v))*section;
      const y=cy+cs*ry;let z=cz+sn*rz;
      if(sn>0){
        let f=0;for(let j=0;j<4;j++){
          const fold=2.035-j*.068+.19*(v-.43)**2+.022*v+.010*Math.sin(j*1.8);
          f+=(.015+.004*Math.sin(j+1))*gaussian(y-fold,.016)-.005*gaussian(y-fold+.026,.015);
        }
        z+=f*sn**2*smooth(v,.05,.18)*(1-smooth(v,.87,1));
      }
      return[x,y,z];
    },true);
    // Match the established physical seat, independently of decorative fabric.
    if(side<0){const index=g.index;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}g.computeVertexNormals();}
    g.computeBoundingBox();g.translate(0,1.65-g.boundingBox.min.y,0);add(g);
  }
  // Both upturned feet are visible lying across the opposite upper thigh in
  // reference 6; the former knee-only silhouette omitted this defining pose.
  for(const side of [-1,1]){
    const points=[[.12,2.22,.52],[.35,2.25,.53],[.72,2.285,.49],[.98,2.27,.455]].map(p=>[p[0]*side,p[1],p[2]]);
    add(swept(points,.128,.078,{segments:64,radial:28,vertical:true,taper:t=>.58+.37*Math.sin(Math.PI*t)+.10*t}));
    for(let i=0;i<5;i++){
      const z=.387+i*.037,len=.145-.012*i,r=.024-.0018*i;
      add(finger([[side*.91,2.275,z],[side*(.99+len*.32),2.285,z+.006],[side*(1.00+len*.60),2.275,z+.009]],r));
    }
  }
  // A continuous cloth tongue overlaps the center seam and lays over the knees.
  add(surface(52,72,(u,v)=>{const x=(u*2-1)*(.24-.06*v+.035*Math.sin(Math.PI*v)),y=1.65+v*.65;return[x,y,.76+.36*(1-v)**.70+.005*Math.sin(x*25+v*2)-.020*(u-.5)**2];}));
  add(palm(true).translate(0,-.065,0));add(palm(false).translate(0,.04,0));
  // Raised anatomical right hand: slender individually tapering fingers,
  // gently separated, with index and thumb curling into the reference mudra.
  const fingers=[
    [[-.660,3.19,.558],[-.685,3.30,.563],[-.691,3.382,.550]],
    [[-.611,3.225,.565],[-.620,3.354,.570],[-.616,3.445,.552]],
    [[-.566,3.23,.565],[-.566,3.361,.562],[-.555,3.431,.540]],
    [[-.524,3.20,.555],[-.493,3.292,.574],[-.463,3.256,.599],[-.475,3.223,.591]],
    [[-.507,3.065,.574],[-.452,3.139,.602],[-.475,3.223,.591]]
  ];
  fingers.forEach((p,i)=>add(finger(p,i===4?.027:.022).translate(0,-.065,0)));
  // Palm-up hand lies across the lap, with four individually defined digits.
  for(let i=0;i<4;i++)add(finger([[.06-i*.024,2.315,.586+i*.052],[-.11,2.325,.59+i*.047],[-.25+.016*i,2.306,.60+i*.043]],.019).translate(0,.04,0));
  add(finger([[.20,2.307,.566],[.12,2.357,.563],[.03,2.356,.595]],.024).translate(0,.04,0));
  // Engraved palm lines: shallow gold recesses, not black drawn strokes.
  add(tube([[-.65,3.105,.605],[-.60,3.093,.610],[-.55,3.109,.601]],.0024,24,6).translate(0,-.065,0),'oldgold');
  add(tube([[-.642,3.155,.605],[-.60,3.171,.609],[-.548,3.168,.601]],.0021,24,6).translate(0,-.065,0),'oldgold');
  // The reference's small central lotus pendant is a shallow carved relief,
  // not a large independent jewel. Its suspension follows the chest surface.
  const pendantY=3.235, pendantZ=clothFrontZ(.020,3.255);
  for(let k=0;k<5;k++){
    const a=(k-2)*.46,g=new T.SphereGeometry(1,14,10);
    g.scale(.014,.048,.008).rotateZ(-a).translate(.020+Math.sin(a)*.040,pendantY+Math.cos(a)*.040,pendantZ);
    addCloth(g);
  }
  addCloth(ellipse(.020,pendantY-.005,pendantZ,.018,.024,.010,16,12));
  for(const side of [-1,1]){
    const points=[];for(let k=0;k<=20;k++){const t=k/20,x=side*(.19*(1-t))+.020*t,y=3.55-.31*Math.sin(t*Math.PI/2);
      const [rx,rz,cz]=sampleProfile(TORSO_PROFILE,y);
      const z=cz+rz*Math.sqrt(Math.max(.01,1-(x/rx)**2))+.008;points.push([x,y,z]);}
    addCloth(tube(points,.004,40,6));
  }
  for(let row=0;row<4;row++){
    const cy=3.07-row*.148,cx=.025-.016*row,cz=clothFrontZ(cx,cy);
    for(let k=0;k<5;k++){const a=k*TAU/5;addCloth(new T.SphereGeometry(1,12,8).scale(.010,.026,.006).rotateZ(-a).translate(cx+Math.sin(a)*.027,cy+Math.cos(a)*.027,cz));}
    addCloth(ellipse(cx,cy,cz,.013,.015,.007,12,8));
  }
  // Broad front robe borders copy the two shoulder-to-lap garment strips.
  // Relief is attached to the cloth surface, never suspended in front of it.
  for(const side of [-1,1]){
    const borderPoint=(t,w=0)=>{const y=2.11+1.51*t,cx=side<0?-.46+.24*t**1.8:.46-.20*t*t,x=cx+w;return[x,y,clothFrontZ(x,y)+.010];};
    addCloth(surface(14,112,(u,v)=>{const width=.065+.030*Math.sin(Math.PI*v),p=borderPoint(v,(u-.5)*width);p[2]+=.007+ .009*Math.cos((u-.5)*Math.PI);return p;}));
    for(const edge of [-1,1]){
      const ps=[];for(let k=0;k<=50;k++){const t=k/50,width=.065+.030*Math.sin(Math.PI*t),p=borderPoint(t,edge*width*.48);p[2]+=.009;ps.push(p);}addCloth(tube(ps,.004,80,6));
    }
    if(side>0)for(let row=0;row<9;row++){
      const t=.13+row*.092,[cx,cy,cz]=borderPoint(t);
      for(let leaf=0;leaf<4;leaf++){const a=leaf*Math.PI/2+.30;addCloth(new T.SphereGeometry(1,10,8).scale(.007,.016,.004).rotateZ(-a).translate(cx+Math.sin(a)*.016,cy+Math.cos(a)*.018,cz+.020));}
      addCloth(ellipse(cx,cy,cz+.022,.007,.009,.004,10,8));
    }
  }
  // Crown curls are small tightly packed rounded curls, confined above hairline.
  addHair(new T.SphereGeometry(1,64,40,0,TAU,0,Math.PI/2).scale(.340,.245,.290).translate(0,4.50,-.025),'oldgold');
  addHair(ellipse(0,4.735,-.025,.145,.115,.143,40,30),'oldgold');
  for(let row=0;row<9;row++){
    const y=4.50+row*.027,rr=.340*Math.sqrt(Math.max(.025,1-((y-4.50)/.245)**2))+.009;
    const count=Math.max(10,Math.round(TAU*rr/.045));
    for(let i=0;i<count;i++){const a=i/count*TAU+(row%2)*Math.PI/count;
      addHair(ellipse(Math.sin(a)*rr,y,-.025+Math.cos(a)*rr*.83,.023,.022,.021,12,10),'oldgold');
    }
  }
  for(let row=0;row<4;row++){const yy=4.70+row*.029,rr=.141*Math.sqrt(Math.max(.035,1-((yy-4.72)/.113)**2));const n=Math.max(7,Math.round(TAU*rr/.042));for(let i=0;i<n;i++){const a=TAU*i/n;addHair(ellipse(Math.sin(a)*rr,yy,-.025+Math.cos(a)*rr,.022,.021,.020,12,10),'oldgold');}}
  addHair(ellipse(0,4.857,-.025,.040,.053,.040,24,18),'buddha');
  add(ellipse(0,4.655,.287,.017,.017,.010,20,14),'gold');
  // Fine gold diadem stands in front of the dark curl cap in reference 6.
  const addDiadem=(g,material='gold')=>add(remapSculptureY(g,y=>4.755+(y-4.505)*1.20),material);
  const diadem=[];
  for(let i=0;i<=48;i++){const a=-Math.PI*.49+i/48*Math.PI*.98;diadem.push([Math.sin(a)*.353,4.505,-.025+Math.cos(a)*.301]);}
  addDiadem(tube(diadem,.008,72,8),'gold');
  for(let i=0;i<13;i++){
    const a=(i-6)*.225,height=.105+.065*Math.exp(-(((i-6)/2.1)**2)),g=new T.SphereGeometry(1,20,16),p=g.attributes.position;
    for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k),t=(y+1)/2;p.setXYZ(k,x*.024*(.70+.30*Math.sin(t*Math.PI)),height*t,z*.011*(.60+.40*Math.sin(t*Math.PI)));}
    g.computeVertexNormals();g.rotateY(a).translate(Math.sin(a)*.351,4.505,-.025+Math.cos(a)*.300);addDiadem(g,'gold');
  }
  for(let i=0;i<29;i++){const a=(i-14)*.105;addDiadem(ellipse(Math.sin(a)*.356,4.507,-.025+Math.cos(a)*.305,.008,.008,.008,10,8),'gold');}
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
  reference:6,frontAxis:'+Z',seatContact:0,headCenter:2.815,crownTop:3.7765,
  raisedHandTop:1.730,kneeWidth:2.580,bodyDepth:1.520,
  referenceFit:{central:{x:0,y:3,z:0,scale:2.1/3.26},attendantScale:1.45/3.26,scaleConvention:'retain original unit conversion, do not normalize by crownTop'},
  materials:{buddha:{color:'#cfaa5d',metalness:.94,roughness:.29},oldgold:{color:'#927036',metalness:.91,roughness:.37},gold:{color:'#d1ab58',metalness:.95,roughness:.27}}
});
export function restoredBuddhaParts() {
  if(!cache.has('reference6'))cache.set('reference6',buildAsset());
  return cache.get('reference6');
}
/** Integrates directly into world's instance(geometry, material, x,y,z,sx,sy,sz). */
export function emitRestoredBuddha(instance,{x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1}={}) {
  for(const p of restoredBuddhaParts())instance(p.geometry,p.material,x,y,z,scale*widthScale,scale,scale*depthScale);
}
/** Standalone scene API: coordinates above remain local to the returned group. */
export function createRestoredBuddha({materials={},x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1}={}) {
  const defaults={
    buddha:new T.MeshStandardMaterial({name:'buddha',color:'#cfaa5d',metalness:.94,roughness:.29}),
    oldgold:new T.MeshStandardMaterial({name:'oldgold',color:'#927036',metalness:.91,roughness:.37}),
    gold:new T.MeshStandardMaterial({name:'gold',color:'#d1ab58',metalness:.95,roughness:.27})
  };
  const group=new T.Group();group.name='reference6-restored-buddha';group.position.set(x,y,z);group.scale.set(scale*widthScale,scale,scale*depthScale);
  for(const p of restoredBuddhaParts()){const mesh=new T.Mesh(p.geometry,materials[p.material]||defaults[p.material]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=p.geometry.name;group.add(mesh);}
  return group;
}
