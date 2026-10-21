import * as T from 'three';

// Scene07 pine158: independent reference-guided procedural geometry study.
// Connected swept wood > bent laterals > short, opaque, closed needle pairs.
// The original eight root positions and the legacy random replay are retained.
// No photograph pixels, canopy hulls, cards, billboards or camera-facing branches.
export const HERO_PINES_REVISION = 'scene07-aged-cloud-pines158-r05';

const TAU = Math.PI * 2;
const UP = new T.Vector3(0, 1, 0);
const vec = p => new T.Vector3(...p);
const rng = initial => {
  let state = initial >>> 0;
  return () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
};
const lerp = (a, b, t) => a + (b - a) * t;
const positionAt = (curve, t) => curve.getPoint(T.MathUtils.clamp(t, 0, 1));

// Optional integration aid. The retired pines consumed the scene's shared
// random stream before the cherries/grass were placed. Advancing that stream
// by exactly the former draws preserves their layout when the eight calls are
// replaced. This function has no geometry, materials, global state or I/O.
export function advanceLegacyPineRandom148(initialSeed) {
  let state = initialSeed >>> 0;
  const next = () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
  const oldPad = () => {
    const boughs = 3 + Math.floor(next() * 3);
    for (let b = 0; b < boughs; b++) {
      for (let j = 0; j < 8; j++) next();
      for (let station = 0; station < 4; station++) for (let side = 0; side < 2; side++) {
        if (next() < .10) continue;
        for (let j = 0; j < 13; j++) next();
      }
    }
  };
  for (let tree = 0; tree < 8; tree++) {
    if (tree) next(); // The right hero had an explicit .15 bend.
    for (let bough = 0; bough < 11; bough++) {
      next(); next(); oldPad();
      if (bough % 3 === 1) oldPad();
    }
    oldPad();
  }
  return state;
}

// These are the existing eight garden origins. Coordinates remain in the
// established garden frame: worldZ = gardenZ * .6 - 3. All dimensions below
// are metres before that existing transform; the helper does not alter it.
export const HERO_PINE_ORIGINS = Object.freeze([
  {id: 'right-hero', x: 12.6, z: 18, h: 10, spread: 1, yaw: -.08, seed: 148031,
    trunk: [[0, 0, 0], [.018, .10, -.008], [-.018, .23, .012], [.046, .395, .012], [.139, .555, -.012], [.188, .695, .009], [.176, .82, -.005], [.147, .89, -.012]],
    fork: {at: .445, points: [[.036, .57, .018], [-.053, .675, .01], [-.11, .775, .018], [-.105, .855, .008]], radius: .52},
    // [height, azimuth, bare reach / h, tip lift / h, shelf reach / h,
    //  shelf half width / h, parent leader (0 main, 1 fork)]
    boughs: [[.25, 3.40, .12, .042, .105, .105], [.365, 3.16, .205, .034, .163, .112], [.43, .20, .19, .025, .142, .11], [.535, 3.30, .225, .026, .174, .13], [.61, -.27, .175, .027, .152, .105], [.69, 3.08, .177, .022, .157, .119, 1], [.765, .31, .146, .016, .151, .109], [.79, 3.28, .115, .02, .144, .116, 1], [.855, 2.90, .112, .014, .142, .103]],
    caps: [[.875, .23, .118, .109, 0], [.85, 2.75, .115, .104, 1]]},
  {id: 'foreground-wide', x: -4.8, z: 20, h: 4.9, spread: 1.40, yaw: .08, seed: 148079,
    trunk: [[0, 0, 0], [-.027, .14, .012], [.028, .31, .025], [.132, .49, .009], [.188, .64, -.018], [.154, .78, -.008], [.165, .86, 0]],
    fork: {at: .365, points: [[-.039, .49, -.017], [-.141, .63, -.032], [-.18, .76, -.015], [-.16, .825, -.025]], radius: .64},
    boughs: [[.385, 3.02, .205, .025, .18, .124], [.47, .08, .24, .032, .174, .116], [.56, 3.48, .245, .025, .185, .135, 1], [.62, -.32, .235, .027, .17, .118], [.70, 2.91, .18, .023, .18, .13, 1], [.74, .36, .162, .02, .156, .115], [.815, 3.31, .125, .013, .145, .116]],
    caps: [[.85, .03, .141, .122, 0], [.811, 2.85, .145, .118, 1]]},
  {id: 'left-middle', x: -10, z: 11, h: 5.7, spread: .9, yaw: -.19, seed: 148119,
    trunk: [[0, 0, 0], [.035, .19, .013], [-.075, .39, -.012], [-.142, .60, .019], [-.125, .75, .024], [-.151, .875, .004]],
    fork: {at: .43, points: [[.008, .585, -.019], [.083, .71, -.027], [.061, .82, -.005]], radius: .48},
    boughs: [[.32, 3.32, .17, .034, .164, .119], [.46, -.18, .22, .034, .172, .12], [.58, 2.96, .235, .028, .183, .125], [.68, .15, .19, .026, .16, .117, 1], [.765, 3.26, .17, .022, .163, .113]],
    caps: [[.86, 3.01, .147, .117, 0], [.808, .08, .133, .111, 1]]},
  {id: 'right-stair', x: 11.5, z: 3.1, h: 5.3, spread: .8, yaw: .12, seed: 148151,
    trunk: [[0, 0, 0], [-.022, .20, .005], [.04, .39, -.021], [.11, .59, .008], [.086, .75, .014], [.111, .87, 0]],
    fork: {at: .40, points: [[-.075, .565, .024], [-.11, .72, .031], [-.092, .81, .014]], radius: .51},
    boughs: [[.33, 3.05, .205, .033, .173, .12], [.45, .18, .225, .032, .183, .126], [.60, 3.38, .225, .025, .177, .13, 1], [.69, -.10, .188, .024, .166, .116], [.785, 3.01, .137, .018, .148, .121]],
    caps: [[.856, .1, .144, .12, 0], [.80, 3.20, .132, .108, 1]]},
  {id: 'left-stair', x: -5, z: 1.4, h: 4.2, spread: .8, yaw: -.26, seed: 148181,
    trunk: [[0, 0, 0], [.025, .20, .013], [-.025, .39, .025], [-.099, .62, -.007], [-.083, .78, -.013], [-.11, .86, 0]],
    boughs: [[.365, .15, .22, .034, .20, .145], [.52, 3.18, .23, .03, .19, .14], [.64, -.24, .19, .027, .177, .124], [.745, 3.34, .16, .022, .163, .124]],
    caps: [[.845, 2.92, .157, .14, 0]]},
  {id: 'back-right', x: 18, z: -4, h: 8.5, spread: 1, yaw: .31, seed: 148223,
    trunk: [[0, 0, 0], [-.018, .20, -.01], [.025, .39, .019], [.097, .58, .028], [.075, .74, -.008], [.103, .89, 0]],
    fork: {at: .46, points: [[-.046, .61, -.02], [-.096, .76, -.025], [-.064, .85, -.009]], radius: .48},
    boughs: [[.30, 3.33, .18, .036, .17, .119], [.445, .19, .22, .035, .186, .13], [.56, 2.98, .23, .027, .177, .13], [.675, -.26, .20, .029, .163, .118], [.735, 3.34, .15, .024, .169, .126, 1], [.81, .32, .128, .018, .14, .115]],
    caps: [[.88, .18, .141, .117, 0], [.84, 3.05, .14, .111, 1]]},
  {id: 'far-left', x: -19, z: 1, h: 6.5, spread: .8, yaw: -.11, seed: 148259,
    trunk: [[0, 0, 0], [.033, .19, -.008], [.085, .37, .017], [.015, .58, .014], [-.043, .74, -.018], [-.016, .88, -.004]],
    fork: {at: .44, points: [[.155, .58, -.011], [.184, .72, -.021], [.145, .81, -.005]], radius: .47},
    boughs: [[.335, 3.27, .205, .032, .178, .128], [.48, .09, .235, .032, .174, .123], [.605, 3.05, .23, .027, .184, .135], [.70, -.23, .18, .024, .169, .12, 1], [.78, 3.31, .159, .022, .161, .124]],
    caps: [[.866, 3.0, .15, .123, 0], [.798, .13, .145, .117, 1]]},
  {id: 'left-island-small', x: -8.8, z: 2.5, h: 3.2, spread: .85, yaw: .25, seed: 148291,
    trunk: [[0, 0, 0], [-.04, .23, .015], [.022, .43, .021], [.08, .63, -.007], [.05, .79, -.011], [.074, .86, 0]],
    boughs: [[.40, 3.13, .22, .03, .216, .154], [.555, .14, .235, .032, .20, .149], [.70, 3.40, .18, .026, .188, .134]],
    caps: [[.845, .15, .18, .15, 0]]}
]);

// Traced structural relationships, rather than a radial tree generator.
// Heights use the established nominal height; the root coordinates above
// remain unchanged. The photograph's right tree is an uneven two-leader
// niwaki, with a low left return and three broad upper crown groups.
const STRUCTURE158 = {
  'right-hero': {
    // Fixed metric curves authored against the existing reference camera.
    // Camera projection was used once to measure the photographed trunk;
    // runtime geometry has no camera input and is a full branching volume.
    trunkMetres: [[0,-.045,0],[.15,1.10,-.02],[.343,2.56,-.027],[.021,3.62,.04],[-.034,4.40,.02],[.216,5.16,-.04],[.703,6.05,-.06],[1.215,6.91,-.11],[1.399,7.96,-.10],[1.458,8.74,-.12],[1.041,9.50,-.08]],
    forkMetres: {at:5.25,points:[[0,5.60,.15],[-.65,6.00,.10],[-.90,6.75,.04],[-.55,7.40,-.12],[-.70,8.15,.04],[-.15,8.80,-.05]],radius:.64},
    trunk: [[0,0,0],[-.026,.105,.008],[-.037,.229,.020],[.002,.348,.018],[.103,.468,.012],[.221,.590,.030],[.304,.704,.043],[.365,.791,.046],[.382,.872,.061]],
    fork: {at:.346,points:[[-.035,.425,.011],[-.117,.515,.040],[-.160,.587,.030],[-.142,.656,.048]],radius:.71},
    boughs: [[.310,3.16,.090,.025,.090,.080], [.450,3.30,.115,.020,.102,.090], [.580,3.15,.110,.040,.130,.100,1], [.625,.45,.105,.042,.120,.100,1], [.665,3.20,.130,.050,.130,.100,1], [.710,.05,.120,.025,.120,.090], [.780,3.10,.115,.035,.130,.105,1], [.785,2.88,.102,.030,.125,.100], [.840,.15,.120,.020,.120,.100], [.900,3.14,.100,.015,.125,.090]],
    caps: [[.946,3.05,.130,.110,0],[.875,3.03,.115,.095,1]]
  },
  'foreground-wide': {
    h:7.2,spread:1.25,
    // The original root is hidden by the foreground roof at the reference
    // pose. This connected sweeping base rises from that exact ground root
    // to the photographed visible trunk and broad crown, in actual metres.
    trunkMetres: [[0,-.045,0],[.50,.35,.10],[1.25,.80,.10],[2.10,1.40,.20],[3.23,2.31,.25],[3.48,2.97,.28],[3.94,3.51,.35],[4.11,3.91,.31],[3.60,4.30,.28],[3.59,4.73,.28],[3.07,5.08,.25],[2.88,5.46,.23],[3.10,6.04,.24]],
    forkMetres: {at:4.03,points:[[3.40,4.30,.15],[2.45,4.55,.12],[1.90,4.85,.14],[1.55,5.28,.16],[1.80,5.67,.12]],radius:.62},
    trunk: [[0,0,0],[-.033,.141,.012],[.014,.280,.026],[.133,.423,.012],[.207,.551,-.013],[.162,.649,-.018],[.198,.731,.009]],
    fork: {at:.326,points:[[-.021,.423,-.014],[-.122,.513,-.034],[-.198,.597,-.014],[-.192,.652,-.021]],radius:.71},
    boughs: [[.540,3.40,.100,.040,.120,.090], [.630,.10,.190,.025,.150,.110], [.650,3.12,.160,.055,.150,.120,1], [.730,.20,.180,.030,.150,.110], [.740,1.30,.150,.035,.130,.110], [.750,3.15,.120,.045,.150,.120,1], [.790,3.00,.100,.035,.130,.110]],
    caps: [[.835,.10,.170,.145,0],[.780,3.00,.140,.120,1]]
  }
};

// Smooth 1D random field, used only for actual millimetre/centimetre bark
// relief. Long fissures wander, broaden, and terminate; they are not rings.
const fract = x => x - Math.floor(x);
const hash = x => fract(Math.sin(x * 127.1 + 311.7) * 43758.5453);
function noise1(x) {
  const i = Math.floor(x), f = x-i, s = f*f*(3-2*f);
  return lerp(hash(i), hash(i+1), s);
}

class WoodMesh158 {
  constructor() { this.positions=[]; this.uvs=[]; this.colors=[]; this.indices=[]; this.branches=0; }
  tube(points,radius,endRadius,seed,{segments,sides,rootFlare=0,age=1,taperPower=.95}={}) {
    const curve=new T.CatmullRomCurve3(points.map(p=>p.isVector3?p.clone():vec(p)),false,'centripetal',.5);
    const length=curve.getLength(), N=segments||Math.max(4,Math.ceil(length/.085)), M=sides||(radius>.16?22:radius>.045?12:6);
    const frames=curve.computeFrenetFrames(N,false), offset=this.positions.length/3;
    for(let j=0;j<=N;j++) {
      const t=j/N,c=curve.getPointAt(t),nominal=lerp(radius,endRadius,Math.pow(t,taperPower));
      const flare=rootFlare*Math.exp(-t*length/Math.max(radius*1.3,.1));
      for(let k=0;k<=M;k++) {
        const a=k/M*TAU;
        const wander=(noise1(t*4+seed*.137)-.5)*.52;
        const coarse=.076*Math.sin(a*5+wander+seed)+.039*Math.sin(a*9-t*2.2+seed*.31);
        const fissure=Math.pow(.5+.5*Math.cos(a*11+wander*2+seed*.71),12);
        const plate=(noise1(k*.83+t*5.3+seed*.025)-.5)*.055;
        const bark=1+age*(coarse+plate-.105*fissure);
        const r=nominal*bark+flare*(1+.22*Math.sin(a*5+.4));
        const q=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);
        this.positions.push(q.x,q.y,q.z); this.uvs.push(k/M*TAU*radius/2,t*length/2);
        const shade=.89+coarse*.55-fissure*.10+(noise1(k*.9+t*18+seed)-.5)*.10;
        this.colors.push(shade,shade,shade);
        if(j<N&&k<M) { const v=offset+j*(M+1)+k; this.indices.push(v,v+1,v+M+1,v+1,v+M+2,v+M+1); }
      }
    }
    for(const [ring,reverse] of [[0,true],[N,false]]) {
      const c=curve.getPointAt(ring/N),centre=this.positions.length/3;
      this.positions.push(...c.toArray()); this.uvs.push(.5,.5); this.colors.push(.81,.81,.81);
      for(let k=0;k<M;k++) { const a=offset+ring*(M+1)+k; this.indices.push(...(reverse?[centre,a+1,a]:[centre,a,a+1])); }
    }
    this.branches++; return curve;
  }
  disc(centre,normal,radius,seed) {
    const n=normal.clone().normalize(),x=new T.Vector3(1,0,0).cross(n); if(x.lengthSq()<.01)x.set(0,0,1).cross(n); x.normalize();
    const z=n.clone().cross(x).normalize(),offset=this.positions.length/3,M=19;
    this.positions.push(...centre.toArray());this.uvs.push(.5,.5);this.colors.push(.73,.73,.73);
    for(let k=0;k<=M;k++) {
      const a=k/M*TAU,r=radius*(1+.055*Math.sin(a*5+seed)),p=centre.clone().addScaledVector(x,Math.cos(a)*r).addScaledVector(z,Math.sin(a)*r);
      this.positions.push(...p.toArray());this.uvs.push(.5+.5*Math.cos(a),.5+.5*Math.sin(a));this.colors.push(.91,.91,.91);
      if(k<M)this.indices.push(offset,offset+k+1,offset+k+2);
    }
  }
  finish(name) {
    const g=new T.BufferGeometry();g.name=name;
    g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uvs,2));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
    g.setIndex(this.indices);g.computeVertexNormals();g.computeBoundingBox();return g;
  }
}

// Two foliage scales share the SAME connected shoot: a closed, ribbed
// aggregate of retained interior fascicles supplies coarse optical mass;
// sparse slender paired needles form the broken illuminated outer surface.
// A retained packet is five individually closed tapered ribs with separate
// pointed ends, not a crown envelope, leaf sphere, hedge ball or alpha plane.
export function createPineShoot158(seed) {
  const random=rng(seed),wood=new WoodMesh158(),positions=[],colors=[],innerPositions=[],innerColors=[];
  const variant=Math.round((seed-158701)/73),retained=variant<8;
  const stemLength=(retained?.135:.105)+random()*.035;
  const stem=wood.tube([[0,0,0],[.009,stemLength*.51,-.004],[.006,stemLength,.011]],.0034,.0011,seed,{segments:4,sides:5,age:.15});
  const tri=(a,b,c,s1,s2,s3)=>{positions.push(...a.toArray(),...b.toArray(),...c.toArray());for(const s of [s1,s2,s3])colors.push(s,s,s);};
  const closedRib=(root,direction,length,width,depth,tone,age)=>{
    const dir=direction.clone().normalize(),side=new T.Vector3(-dir.z,.045,dir.x).normalize(),cross=dir.clone().cross(side).normalize();
    const mid=root.clone().addScaledVector(dir,length*.53);mid.y+=length*.035;
    const tip=root.clone().addScaledVector(dir,length);tip.y-=length*.075;
    const ring=[mid.clone().addScaledVector(side,width),mid.clone().addScaledVector(side,-width*.64).addScaledVector(cross,depth),mid.clone().addScaledVector(side,-width*.64).addScaledVector(cross,-depth)];
    const emit=(a,b,c,shade)=>{innerPositions.push(...a.toArray(),...b.toArray(),...c.toArray());for(let j=0;j<3;j++)innerColors.push(shade*(age?.83:.96),shade,shade*(age?.79:.86));};
    for(let k=0;k<3;k++){const n=(k+1)%3;emit(root,ring[n],ring[k],tone*.82);emit(tip,ring[k],ring[n],tone);}
  };
  if(retained) {
    // Older needles overlap deeply near the woody axis and bend outward.
    // Coarse packets intentionally remain closed at delivery pixel scale;
    // their five longitudinal ribs and pointed tips retain pine grain.
    const packetCount=16+(variant%3)*2;
    for(let packet=0;packet<packetCount;packet++) {
      const t=.08+(packet%6)*.144+random()*.055,base=positionAt(stem,t),a=packet*2.39996+random()*.30;
      const lean=.02+random()*.30,axis=new T.Vector3(Math.cos(a),lean,Math.sin(a)).normalize(),side=new T.Vector3(-Math.sin(a),.03,Math.cos(a)).normalize();
      const length=.105+random()*.055;
      for(let rib=0;rib<5;rib++) {
        const offset=(rib-2)*.0045,root=base.clone().addScaledVector(side,offset*.10),d=axis.clone().addScaledVector(side,(rib-2)*.075);d.y+=.04*Math.sin(rib*2.1+packet);
        const width=.0035+random()*.0016,depth=width*.62;
        closedRib(root,d,length*(.78+random()*.28),width,depth,.69+random()*.23,packet%5===0);
      }
    }
  }
  // Fine exterior detail is deliberately sparser than r04: the new coarse
  // mass comes from retained packets and broad branch overlap, not a blind
  // multiplication of subpixel fine needles.
  for(let node=0;node<6;node++) {
    const t=.10+node*.17,base=positionAt(stem,t),phase=node*2.39996+random()*.35;
    for(let fascicle=0;fascicle<4;fascicle++) {
      const az=phase+fascicle*TAU/4+(random()-.5)*.24;
      for(const pair of [-1,1]) {
        const a=az+pair*(.035+random()*.055),length=.095+random()*.057,up=.24+random()*.43;
        const radial=Math.sqrt(1-up*up),direction=new T.Vector3(Math.cos(a)*radial,up,Math.sin(a)*radial);
        const side=new T.Vector3(-Math.sin(a),.035,Math.cos(a)).normalize(),cross=direction.clone().cross(side).normalize();
        const root=base.clone().addScaledVector(side,pair*.001),middle=root.clone().addScaledVector(direction,length*.52),tip=root.clone().addScaledVector(direction,length);
        middle.y+=.004;tip.y-=.008;
        const w=.00125+random()*.00085,d=w*.60;
        const ring=[middle.clone().addScaledVector(side,w),middle.clone().addScaledVector(side,-w*.65).addScaledVector(cross,d),middle.clone().addScaledVector(side,-w*.65).addScaledVector(cross,-d)];
        const tone=.79+random()*.27;
        for(let k=0;k<3;k++){const next=(k+1)%3;tri(root,ring[next],ring[k],tone*.82,tone,tone*.95);tri(tip,ring[k],ring[next],tone*1.13,tone*.95,tone);}
      }
    }
  }
  const needle=new T.BufferGeometry();needle.name='pine158-short-closed-paired-needles-'+seed;
  needle.setAttribute('position',new T.Float32BufferAttribute(positions,3));needle.setAttribute('color',new T.Float32BufferAttribute(colors,3));needle.computeVertexNormals();needle.computeBoundingBox();
  const interior=new T.BufferGeometry();interior.name='pine158-retained-ribbed-fascicles-'+seed;
  interior.setAttribute('position',new T.Float32BufferAttribute(innerPositions,3));interior.setAttribute('color',new T.Float32BufferAttribute(innerColors,3));interior.computeVertexNormals();interior.computeBoundingBox();
  return {needle,interior,twig:wood.finish('pine158-connected-growing-shoot-'+seed)};
}

function atHeight158(curve,height) {
  let lo=0,hi=1;
  for(let j=0;j<20;j++){const t=(lo+hi)*.5;if(curve.getPoint(t).y<height)lo=t;else hi=t;}
  return curve.getPoint((lo+hi)*.5);
}

/** Pure geometry builder used by the live adapter AND the offline verifier. */
export function buildPineGeometry158(origin) {
  const spec={...origin,...(STRUCTURE158[origin.id]||{})},random=rng(spec.seed+1581),range=(a,b)=>lerp(a,b,random());
  const wood=new WoodMesh158(),cuts=new WoodMesh158(),shoots=[],h=spec.h,spread=spec.spread,hero=spec.id==='right-hero',foreground=spec.id==='foreground-wide';
  const p=q=>[q[0]*h,q[1]*h-.045,q[2]*h],R=h*(hero?.039:foreground?.046:.038);
  const trunk=wood.tube(spec.trunkMetres||spec.trunk.map(p),R,h*.0075,spec.seed,{segments:100,sides:64,rootFlare:R*.31,taperPower:1.18});
  const leaders=[trunk];
  const fork=spec.forkMetres||spec.fork;
  if(fork) {
    const start=atHeight158(trunk,spec.forkMetres?fork.at:h*fork.at-.045);
    leaders.push(wood.tube([start,...(spec.forkMetres?fork.points:fork.points.map(p))],R*fork.radius,h*.0048,spec.seed+107,{segments:56,sides:40}));
    // The living union swells naturally at the crotch, overlapping both
    // parent tubes rather than ending an independent cylinder in mid-air.
    const up=leaders[1].getPoint(.18),root=start.clone().lerp(up,.10);
    wood.tube([root,root.clone().lerp(up,.50),up],R*fork.radius*1.13,R*fork.radius*.72,spec.seed+701,{segments:9,sides:20});
  }
  for(let j=0;j<7;j++) {
    const a=j*TAU/7+range(-.22,.22),reach=h*range(.064,.106);
    wood.tube([[0,h*.026,0],[Math.cos(a)*reach*.44,.060,Math.sin(a)*reach*.44],[Math.cos(a)*reach,-.076,Math.sin(a)*reach]],R*range(.32,.48),.006,spec.seed+31*j,{segments:12,sides:12});
  }
  const placeShoot=(point,direction,scale,tip=false)=>{
    const q=new T.Quaternion().setFromUnitVectors(UP,direction.clone().normalize());q.multiply(new T.Quaternion().setFromAxisAngle(UP,range(-Math.PI,Math.PI)));
    const e=new T.Euler().setFromQuaternion(q);
    shoots.push({variant:tip?8+Math.floor(random()*4):Math.floor(random()*8),material:tip?'heroPineNeedleTip148':'heroPineNeedle148',p:point.toArray(),scale,rotation:[e.x,e.y,e.z],tint:range(.93,1.08)});
  };
  let cushions=0,boughs=0;
  // Every irregular cushion grows from a real bent spine. Unequal laterals
  // occupy different vertical levels; each bears its own bent twig shoots.
  // Staggered stations and lost tips create small open channels through the
  // mass, while the overlapping neighbouring cushions close large holes.
  const cushion=(base,heading,length,halfWidth,phase,loft=0)=>{
    const forward=new T.Vector3(Math.cos(heading),0,Math.sin(heading)),across=new T.Vector3(-Math.sin(heading),0,Math.cos(heading));
    const lateral=range(-.17,.17)*halfWidth;
    const mid=base.clone().addScaledVector(forward,length*.47).addScaledVector(across,lateral*.4);mid.y+=length*.065+loft;
    const end=base.clone().addScaledVector(forward,length).addScaledVector(across,lateral);end.y+=length*range(.06,.14)+loft*.6;
    const axis=wood.tube([base,mid,end],Math.min(.052,.018+h*.0025),.0040,phase,{segments:10,sides:8,age:.55});
    const stations=Math.max(5,Math.min(8,Math.ceil(length/.18))),widthBias=range(.88,1.07);
    for(let station=0;station<stations;station++) {
      const t=.11+station*.84/(stations-1)+range(-.029,.029),joint=positionAt(axis,t);
      for(const side of [-1,1]) {
        // A few missing outer fingers leave recognizable feathered holes.
        if(station>1&&station<stations-1&&random()<.055)continue;
        const lobe=(.42+.58*Math.pow(Math.sin(t*Math.PI),.64))*widthBias;
        const reach=halfWidth*lobe*range(.71,1.11),along=length*range(.13,.26);
        const lateralEnd=joint.clone().addScaledVector(across,side*reach).addScaledVector(forward,along);
        lateralEnd.y+=range(-.045,.23)+loft*.35+Math.sin(station*2.29+phase)*.073;
        const elbow=joint.clone().lerp(lateralEnd,.53);elbow.y-=range(.012,.045);
        const lateralCurve=wood.tube([joint,elbow,lateralEnd],range(.009,.015),.0023,phase+station*29+side,{segments:6,sides:6,age:.35});
        const lateralLength=lateralCurve.getLength(),sprigs=Math.max(4,Math.min(7,Math.ceil(lateralLength/.135)));
        for(let j=0;j<sprigs;j++) {
          const tt=.19+j*.79/(sprigs-1)+range(-.021,.021),twigBase=positionAt(lateralCurve,tt),tangent=lateralCurve.getTangent(tt).normalize();
          const forkSide=(j%2?1:-1)*side,twigDirection=tangent.clone().multiplyScalar(range(.30,.60)).addScaledVector(forward,range(-.16,.22)).addScaledVector(across,forkSide*range(.25,.55));
          twigDirection.y=range(.30,.84);twigDirection.normalize();
          const extension=range(.055,.115),twigTip=twigBase.clone().addScaledVector(twigDirection,extension),bend=twigBase.clone().lerp(twigTip,.45);bend.addScaledVector(forward,range(-.014,.018));
          wood.tube([twigBase,bend,twigTip],.0032,.0011,phase+station*71+j*7,{segments:3,sides:5,age:.15});
          placeShoot(twigTip,twigDirection,range(.84,1.22)*(h<4?.90:1),random()<.17&&tt>.46);
          // Two close pairs at alternate nodes give a tuft of genuine
          // individual shoots instead of one scaled-up star/needle brush.
          if(j%2===0||random()<.32) {
            const b=positionAt(lateralCurve,Math.min(.98,tt+.045));
            const d=tangent.clone().multiplyScalar(.55).addScaledVector(across,-forkSide*.45);d.y=range(.25,.78);d.normalize();
            const end=b.clone().addScaledVector(d,range(.055,.105));wood.tube([b,b.clone().lerp(end,.54),end],.0027,.0010,phase+j*97+station,{segments:3,sides:5,age:.1});
            placeShoot(end,d,range(.85,1.16),random()<.12);
          }
        }
        placeShoot(lateralEnd,lateralCurve.getTangent(1).add(new T.Vector3(0,.75,0)),range(.91,1.18),random()<.22);
      }
    }
    for(let j=0;j<stations;j++) {
      const t=.17+j*.82/(stations-1),root=positionAt(axis,t),d=forward.clone().multiplyScalar(.25);d.y=1;d.addScaledVector(across,range(-.45,.45)).normalize();
      const end=root.clone().addScaledVector(d,range(.06,.13));wood.tube([root,root.clone().lerp(end,.5),end],.0032,.0011,phase+j*31,{segments:3,sides:5,age:.1});placeShoot(end,d,range(.88,1.25),random()<.19);
    }
    cushions++;
  };
  for(let j=0;j<spec.boughs.length;j++) {
    const [height,heading,reachFactor,lift,crownReach,crownWidth,parent=0]=spec.boughs[j],a=heading+range(-.055,.055);
    const root=atHeight158(leaders[parent]||trunk,height*h-.045),forward=new T.Vector3(Math.cos(a),0,Math.sin(a)),across=new T.Vector3(-Math.sin(a),0,Math.cos(a));
    const reach=reachFactor*h*spread,sweep=range(-.11,.11)*reach;
    const shoulder=root.clone().addScaledVector(forward,reach*.23).addScaledVector(across,-sweep*.25);shoulder.y+=lift*h*.10-reach*.070;
    const elbow=root.clone().addScaledVector(forward,reach*.65).addScaledVector(across,sweep*.44);elbow.y+=lift*h*.44-reach*.065;
    const end=root.clone().addScaledVector(forward,reach).addScaledVector(across,sweep);end.y+=lift*h;
    const r=h*(.023-height*.012)*(parent?.86:1);
    const bough=wood.tube([root,shoulder,elbow,end],r,Math.max(.011,h*.0021),spec.seed+j*197,{segments:26,sides:15});
    // Foliage grows over the outer bough, not only beyond a single bare tip.
    // A staggered left/right/forward grouping makes each crown group a
    // shallow volume with a broken outline, rather than a flat radial fan.
    const L=crownReach*h*spread,W=crownWidth*h*spread;
    const arrangements=[{t:.35,a:-.47,l:.65,w:.74,y:-.012},{t:.64,a:.46,l:.69,w:.73,y:.035},{t:.91,a:-.10,l:.71,w:.82,y:-.010}];
    if(hero||foreground||h>6)arrangements.push({t:.65,a:Math.PI*.64*(j%2?1:-1),l:.47,w:.62,y:.065});
    for(let k=0;k<arrangements.length;k++) {
      const c=arrangements[k],p0=positionAt(bough,c.t),ca=a+c.a+range(-.13,.13);
      cushion(p0,ca,L*c.l*range(.90,1.08),W*c.w*range(.91,1.08),spec.seed+j*211+k*71,h*c.y*.50+range(-.045,.045));
    }
    boughs++;
  }
  for(let j=0;j<spec.caps.length;j++) {
    const [height,heading,reach,width,parent=0]=spec.caps[j],root=atHeight158(leaders[parent]||trunk,height*h-.045),L=reach*h*spread,W=width*h*spread;
    for(let k=0;k<4;k++) {
      const a=heading+(k-1.5)*1.12+range(-.14,.14);
      cushion(root,a,L*range(.56,.86),W*range(.55,.81),spec.seed+4001+j*197+k*37,range(-.085,.16));
    }
  }
  // Small dead stubs, some hollows and uneven scars are fixed to the trunk.
  // They remain secondary to the substantial living crotch and branch taper.
  for(let j=0;j<(h>6?5:3);j++) {
    const root=atHeight158(trunk,h*(.16+j*.106)),a=j*2.38+spec.seed*.01,len=h*range(.022,.042),d=new T.Vector3(Math.cos(a),range(.12,.38),Math.sin(a)).normalize();
    const tip=root.clone().addScaledVector(d,len),rr=R*range(.16,.27);
    wood.tube([root,root.clone().lerp(tip,.46),tip],rr,rr*.67,spec.seed+j*71,{segments:7,sides:13});cuts.disc(tip.clone().addScaledVector(d,.0015),d,rr*.56,j);
  }
  const bark=wood.finish(spec.id+'-continuous-aged-wood158'),scars=cuts.finish(spec.id+'-pruning-scars158');
  return {spec,bark,cuts:scars,shoots,stats:{modeledHeightParameter:h,modeledSpreadParameter:spread,primaryBoughs:boughs,foliageCushions:cushions,terminalShoots:shoots.length,connectedWoodMembers:wood.branches,localWoodBounds:{min:bark.boundingBox.min.toArray(),max:bark.boundingBox.max.toArray()}}};
}

async function installMaterials158(mats,barkAssetBase) {
  const base=barkAssetBase||new URL('../assets/hero-pines148/pine-bark/',import.meta.url).href;
  const loader=new T.TextureLoader(),paths=['pine_bark_diff_1k.jpg','pine_bark_nor_gl_1k.jpg','pine_bark_rough_1k.jpg'];
  const [map,normalMap,roughnessMap]=await Promise.all(paths.map(p=>loader.loadAsync(new URL(p,base).href)));
  for(const t of [map,normalMap,roughnessMap]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}map.colorSpace=T.SRGBColorSpace;
  mats.heroPineBark148=new T.MeshStandardMaterial({name:'scene07-aged-pine-bark158',color:0xd1c2a8,roughness:.97,map,normalMap,roughnessMap,normalScale:new T.Vector2(.56,.56),vertexColors:true});
  mats.heroPineTwig148=new T.MeshStandardMaterial({name:'scene07-pine-growing-twigs158',color:0x716044,roughness:.96,vertexColors:true});
  mats.heroPineCut148=new T.MeshStandardMaterial({name:'scene07-old-pruning-scars158',color:0x8b795b,roughness:.98,vertexColors:true});
  mats.heroPineInterior158=new T.MeshStandardMaterial({name:'scene07-retained-opaque-fascicle-interior158',color:0x536f34,roughness:.92,vertexColors:true});
  mats.heroPineNeedle148=new T.MeshPhysicalMaterial({name:'scene07-short-paired-needles158',color:0x829744,roughness:.74,clearcoat:.025,clearcoatRoughness:.58,side:T.DoubleSide,vertexColors:true});
  mats.heroPineNeedleTip148=mats.heroPineNeedle148.clone();mats.heroPineNeedleTip148.name='scene07-pine-new-growth158';mats.heroPineNeedleTip148.color.setHex(0xabb653);
  for(const m of [mats.heroPineNeedle148,mats.heroPineNeedleTip148]) {
    m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nvec3 pineSun158=normalize((viewMatrix*vec4(-.58,.035,-.81,0.0)).xyz); float needleThrough158=pow(max(dot(-normal,pineSun158),0.0),2.5); reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(1.0,.74,.41)*needleThrough158*.48;');};
    m.customProgramCacheKey=()=>HERO_PINES_REVISION;m.forceSinglePass=true;
  }
  return ['heroPineBark148','heroPineTwig148','heroPineCut148','heroPineNeedle148','heroPineNeedleTip148','heroPineInterior158'];
}

/** Drop-in replacement for148; root calls it under the unchanged garden transform. */
export async function buildHeroPines({emit,mats,hillHeight,group,barkAssetBase}) {
  const materialKeys=await installMaterials158(mats,barkAssetBase),variants=Array.from({length:12},(_,i)=>createPineShoot158(158701+i*73));
  const stats={revision:HERO_PINES_REVISION,visualAccepted:false,treeCount:0,boughs:0,shelfFans:0,terminalShoots:0,needleTriangles:0,interiorTriangles:0,woodTriangles:0,materialKeys,trees:[],assets:[{name:'Pine Bark',author:'Dimitrios Savva',license:'CC0-1.0',source:'https://polyhaven.com/a/pine_bark',provenance:'reconstructions/scene-07/assets/hero-pines148/pine-bark/provenance.json'}],construction:'continuous aged trunk/fork > sweeping tapered bough > overlapping unequal bent-spine cushions > staggered laterals > bent short shoots > dark closed ribbed retained fascicle packets plus sparse bright closed paired needles; no crown hulls, cards or billboard surfaces'};
  for(const origin of HERO_PINE_ORIGINS) {
    const tree=buildPineGeometry158(origin),rootY=Math.max(0,hillHeight(origin.x,origin.z*.6-3));
    group(origin.x,rootY,origin.z,origin.yaw,1,()=>{
      emit(tree.bark,'heroPineBark148',0,0,0);emit(tree.cuts,'heroPineCut148',0,0,0);
      for(const item of tree.shoots) {
        const v=variants[item.variant],[x,y,z]=item.p,s=item.scale;
        if(v.interior.attributes.position.count){emit(v.interior,'heroPineInterior158',x,y,z,s,s,s,item.rotation,item.tint);stats.interiorTriangles+=v.interior.attributes.position.count/3;}
        emit(v.twig,'heroPineTwig148',x,y,z,s,s,s,item.rotation,item.tint);emit(v.needle,item.material,x,y,z,s,s,s,item.rotation,item.tint);
        stats.needleTriangles+=v.needle.attributes.position.count/3;stats.woodTriangles+=v.twig.index.count/3;
      }
    });
    stats.treeCount++;stats.boughs+=tree.stats.primaryBoughs;stats.shelfFans+=tree.stats.foliageCushions;stats.terminalShoots+=tree.shoots.length;stats.woodTriangles+=(tree.bark.index.count+tree.cuts.index.count)/3;
    stats.trees.push({id:origin.id,originGarden:[origin.x,rootY,origin.z],originWorld:[origin.x,rootY,origin.z*.6-3],nominalHeight:origin.h,spread:origin.spread,yaw:origin.yaw,...tree.stats});
  }
  return stats;
}

