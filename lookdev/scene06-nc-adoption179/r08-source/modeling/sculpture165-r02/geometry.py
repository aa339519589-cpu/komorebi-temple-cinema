"""Sculpture165: authored weighted robe and crossed knees, CC BY head bearing.

Imported by the official queued Blender builder. These are closed sculptural
surfaces and geometric relief, without any photograph or projected texture.
"""
import bpy,bmesh,math,bisect
from math import sin,cos,pi,exp,sqrt
from mathutils import Vector
from mathutils.bvhtree import BVHTree

COLLECTION=None
OBJECTS=[]
GOLD=None
def clamp(x,a=0,b=1):return max(a,min(b,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
def mix(a,b,t):return a+(b-a)*t
def gauss(x,s):return exp(-.5*(x/s)**2)

def facial_surface_y(x,z):
    """New authored facial tissue volume in BlenderZ-up, front is-Y.

    This is a curved cross-section with local orbital/nasal/labial clay
    volumes, not a photograph/depth field or a camera-facing surface.
    """
    rx=profile([(2.54,.230),(2.64,.257),(2.74,.285),(2.88,.317),(3.03,.312),(3.18,.300),(3.23,.295)],z)
    depth=profile([(2.54,.280),(2.64,.320),(2.74,.312),(2.88,.302),(3.03,.304),(3.18,.305),(3.23,.300)],z)
    q=clamp(x/rx,-.999,.999);front=max(.001,1-q*q)**.37
    h=.013*gauss(x,.14)*gauss(z-2.640,.060)
    # Full malar planes remain below the downcast eyes; there is no deep
    # triangular source orbit or raised crying-like upper-lid arch.
    for side in(-1,1):
        h+=.019*gauss(x-side*.187,.091)*gauss(z-2.910,.074)
        ex=(x-side*.145)/.095
        if abs(ex)<1.15:
            g=1-smooth((abs(ex)-.91)/.24);inside=max(0,1-ex*ex)
            eye=3.009+.003*inside+.002*ex*side
            h-=.010*g*gauss(z-3.025,.038)
            h+=.014*g*gauss(z-eye-.011*inside**.8,.010)
            h+=.0040*g*gauss(z-eye+.007*inside**.8,.010)
            h-=.009*g*gauss(z-eye,.0038)
            brow=3.070+.018*sqrt(inside)
            h+=.0085*g*gauss(z-brow,.019)
    # Long, softly planed bridge, rounded tip, separate low alar masses.
    bridge=profile([(2.76,0),(2.805,.015),(2.850,.080),(2.900,.073),(2.990,.040),(3.070,0)],z)
    h+=bridge*gauss(x,.041)
    for side in(-1,1):
        h+=.026*gauss(x-side*.045,.024)*gauss(z-2.840,.025)
        h-=.012*gauss(x-side*.047,.010)*gauss(z-2.820,.009)
    h+=.010*gauss(x,.015)*gauss(z-2.815,.019)
    h-=.0040*gauss(x,.012)*gauss(z-2.780,.020)
    h+=.0035*(gauss(x-.020,.009)+gauss(x+.020,.009))*gauss(z-2.779,.021)
    # Shallow closed lips, slightly lifted corners and a broad chin return.
    mouth=2.743+.006*(x/.090)**2;lip=gauss(x,.078)
    h+=.010*lip*gauss(z-mouth-.008-.002*gauss(x,.020),.008)
    h+=.012*lip*gauss(z-mouth+.011,.010)
    h-=.0080*lip*gauss(z-mouth,.0035)
    for side in(-1,1):h-=.004*gauss(x-side*.080,.012)*gauss(z-mouth,.009)
    h-=.0045*gauss(x,.095)*gauss(z-2.697,.016)
    return .012-depth*front-h

def facial_incision(name,x0,x1,zfn,halfheight,material):
    # Closed incised bronze floor follows the actual curved tissue, with a
    # real small thickness. It is not a decal or a view-facing line.
    U=90;V=6;vv=[];ff=[]
    for back in(0,1):
        for i in range(U+1):
            u=i/U;q=2*u-1;x=mix(x0,x1,u);hh=halfheight*max(0,1-q*q)**.7
            for j in range(V+1):
                z=zfn(q,x)+(2*j/V-1)*hh;y=facial_surface_y(x,z)-.0006+back*.004
                vv.append((x,y,z))
    stride=(U+1)*(V+1)
    for back in(0,1):
        for i in range(U):
            for j in range(V):
                a=back*stride+i*(V+1)+j;f=(a,a+1,a+V+2,a+V+1);ff.append(f if not back else tuple(reversed(f)))
    for i in range(U):
        for j in(0,V):
            a=i*(V+1)+j;b=(i+1)*(V+1)+j;ff.append((a,b,b+stride,a+stride))
    for i in(0,U):
        for j in range(V):
            a=i*(V+1)+j;ff.append((a,a+stride,a+stride+1,a+1))
    return mesh(name,vv,ff,material,'incised-facial-floor')

def make_face_incisions(material):
    for side in(-1,1):
        facial_incision('S165_R02_downcast_eye_floor_'+str(side),side*.145-.093,side*.145+.093,lambda q,x,s=side:3.009+.003*max(0,1-q*q)+.002*q*s,.0029,material)
    facial_incision('S165_R02_closed_lip_cleft',-.077,.077,lambda q,x:2.743+.006*(x/.090)**2,.0016,material)

def profile(keys,t):
    if t<=keys[0][0]:return keys[0][1]
    if t>=keys[-1][0]:return keys[-1][1]
    ds=[(keys[i+1][1]-keys[i][1])/(keys[i+1][0]-keys[i][0])for i in range(len(keys)-1)]
    slopes=[ds[0]]+[0 if a*b<=0 else 2*a*b/(a+b)for a,b in zip(ds,ds[1:])]+[ds[-1]]
    for i,((a,x),(b,y))in enumerate(zip(keys,keys[1:])):
        if a<=t<=b:
            u=(t-a)/(b-a);h=b-a
            return (2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*h*slopes[i]+(-2*u**3+3*u*u)*y+(u**3-u*u)*h*slopes[i+1]

def mesh(name,vertices,faces,material=None,category='body'):
    me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);COLLECTION.objects.link(ob)
    ob.data.materials.append(material or GOLD)
    for p in me.polygons:p.use_smooth=True
    ob['component']=category;OBJECTS.append(ob);return ob

def recalc(ob):
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free();ob.data.update()

def ellipsoid(name,c,s,material=None,n=44,m=28,category='body'):
    vv=[];ff=[]
    for j in range(m+1):
        v=pi*j/m
        for k in range(n):
            a=2*pi*k/n;vv.append((s[0]*sin(v)*cos(a),s[1]*sin(v)*sin(a),s[2]*cos(v)))
    for j in range(m):
        for k in range(n):
            a=j*n+k;b=j*n+(k+1)%n;ff.append((a,a+n,b+n,b))
    ob=mesh(name,vv,ff,material,category);ob.location=c;return ob

def catmull(points,steps=14):
    ps=[Vector(p)for p in points];out=[]
    for i in range(len(ps)-1):
        a=ps[max(0,i-1)];b=ps[i];c=ps[i+1];d=ps[min(len(ps)-1,i+2)]
        for k in range(steps):
            t=k/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    out.append(ps[-1]);return out

def sweep(name,points,radii,aspect=1,material=None,sides=32,steps=18,deform=None,category='body'):
    path=catmull(points,steps);vv=[];ff=[]
    rkeys=[(i/(len(radii)-1),v)for i,v in enumerate(radii)]
    for j,p in enumerate(path):
        t=j/(len(path)-1);rr=profile(rkeys,t)
        tangent=(path[min(j+1,len(path)-1)]-path[max(j-1,0)]).normalized()
        axis=Vector((0,1,0))
        if abs(axis.dot(tangent))>.96:axis=Vector((1,0,0))
        b=tangent.cross(axis).normalized();c=tangent.cross(b).normalized()
        for k in range(sides):
            a=2*pi*k/sides;n=(b*cos(a)+c*sin(a)*aspect);v=p+rr*n
            if deform:v=Vector(deform(v,n,t,a))
            vv.append(tuple(v))
    for j in range(len(path)-1):
        for k in range(sides):
            a=j*sides+k;b=j*sides+(k+1)%sides;ff.append((a,b,b+sides,a+sides))
    ff.append(tuple(range(sides-1,-1,-1)));ff.append(tuple((len(path)-1)*sides+k for k in range(sides)))
    return mesh(name,vv,ff,material,category)

def ring_mesh(name,rings,material=None,category='body',cap=True):
    n=len(rings[0]);vv=[tuple(v)for ring in rings for v in ring];ff=[]
    for j in range(len(rings)-1):
        for k in range(n):
            a=j*n+k;b=j*n+(k+1)%n;ff.append((a,b,b+n,a+n))
    if cap:ff.extend([tuple(range(n-1,-1,-1)),tuple((len(rings)-1)*n+k for k in range(n))])
    return mesh(name,vv,ff,material,category)

class Fold:
    def __init__(self,points,height,width,phase=0):
        ps=[Vector(p)for p in points];self.ps=[]
        for i in range(101):
            t=i/100;v=(1-t)**3*ps[0]+3*(1-t)**2*t*ps[1]+3*(1-t)*t*t*ps[2]+t**3*ps[3];self.ps.append(v)
        self.xs=[v.x for v in self.ps];self.h=height;self.w=width;self.phase=phase
    def field(self,x,z):
        if not(self.xs[0]<x<self.xs[-1]):return 0
        i=min(99,max(0,bisect.bisect_right(self.xs,x)-1));u=(x-self.xs[i])/max(1e-8,self.xs[i+1]-self.xs[i]);t=(i+u)/100
        zz=mix(self.ps[i].y,self.ps[i+1].y,u);d=z-zz
        env=smooth(t/.10)*smooth((1-t)/.10)
        h=self.h*(.72+.30*sin(pi*t)+.11*sin(5.2*t+self.phase));w=self.w*(.76+.44*sin(pi*t))
        # One broad turning plane and a subordinate compressed underside.
        # The broad shoulder prevents a row of identical half-round ribs.
        return env*(h*.78*gauss(d,w)+h*.27*gauss(d-w*.72,w*1.8)-h*.47*gauss(d+w*.96,w*.43))

FOLDS=[
 Fold([(-.51,2.055),(-.25,1.79),(.09,1.94),(.355,2.265)],.021,.045,.4),
 Fold([(-.54,1.865),(-.28,1.590),(.08,1.695),(.388,2.115)],.033,.057,1.8),
 Fold([(-.535,1.655),(-.28,1.395),(.11,1.490),(.420,1.972)],.043,.068,2.9),
 Fold([(-.50,1.421),(-.27,1.215),(.13,1.295),(.435,1.788)],.032,.055,4.2),
 Fold([(-.455,1.205),(-.25,1.046),(.14,1.112),(.412,1.560)],.037,.063,.9),
 Fold([(-.34,1.033),(-.18,.918),(.12,.955),(.372,1.335)],.023,.046,3.1),
 # Short branches end in the broad fold above them instead of filling the
 # whole chest with equidistant horizontal arcs.
 Fold([(-.47,1.705),(-.34,1.551),(-.14,1.525),(.018,1.574)],.011,.025,1.1),
 Fold([(-.41,1.300),(-.31,1.177),(-.14,1.155),(.035,1.193)],.012,.026,2.2),
]
WIDTH=[(.67,.47),(.87,.55),(1.15,.61),(1.46,.655),(1.77,.665),(2.02,.675),(2.23,.632),(2.40,.425),(2.51,.280),(2.60,.258)]
DEPTH=[(.67,.29),(.87,.345),(1.15,.382),(1.46,.385),(1.77,.365),(2.02,.320),(2.23,.280),(2.40,.226),(2.51,.200),(2.60,.195)]

def cloth_height(x,z):
    h=sum(f.field(x,z)for f in FOLDS)
    for i,(xp0,amp,ww) in enumerate([(.343,.027,.033),(.428,.021,.029),(.505,.013,.025)]):
        zz=clamp((z-.84)/1.40);xp=xp0+.051*sin(zz*2.1+i*.65)-.057*(1-zz)
        env=smooth((z-.83)/.23)*smooth((2.32-z)/.19)
        h+=env*(amp*gauss(x-xp,ww)-amp*.53*gauss(x-xp+.037,ww*.42))
    return h

def front_y(x,z):
    w=profile(WIDTH,z);d=profile(DEPTH,z);q=clamp(x/w,-.999,.999);f=sqrt(max(0,1-q*q))
    return .075-d*f-cloth_height(x,z)*f**1.4

def make_torso():
    rings=[];N=256;M=235
    for j in range(M+1):
        z=mix(.67,2.60,j/M);w=profile(WIDTH,z);d=profile(DEPTH,z);ring=[]
        for k in range(N):
            a=2*pi*k/N;x=w*sin(a);c=cos(a);y=.075-d*c
            if c>0:y-=cloth_height(x,z)*c**1.4
            else:y+=.012*sin(5*a+.6*z)*gauss(z-1.55,.62)*(-c)**2
            ring.append((x,y,z))
        rings.append(ring)
    return ring_mesh('R08_torso_broad_irregular_carved_planes',rings)

def flat_hem(name,xz_points,widths,offset=.014,thickness=.018):
    path=catmull([(x,0,z)for x,z in xz_points],20);vv=[];ff=[];U=12
    for back in (0,1):
        for j,p in enumerate(path):
            t=j/(len(path)-1);w=profile([(i/(len(widths)-1),v)for i,v in enumerate(widths)],t)
            tang=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized();cross=Vector((tang.z,0,-tang.x))
            for k in range(U+1):
                u=-1+2*k/U;v=p+cross*(w*u/2);y=front_y(v.x,v.z)-offset-.008*(1-u*u)+back*thickness
                vv.append((v.x,y,v.z))
    rows=len(path);size=rows*(U+1)
    for b in range(2):
        for j in range(rows-1):
            for k in range(U):
                a=b*size+j*(U+1)+k;q=(a,a+1,a+U+2,a+U+1);ff.append(q if not b else tuple(reversed(q)))
    for j in range(rows-1):
        for k in (0,U):
            a=j*(U+1)+k;b=(j+1)*(U+1)+k;ff.append((a,b,b+size,a+size))
    for j in (0,rows-1):
        for k in range(U):
            a=j*(U+1)+k;ff.append((a,a+size,a+size+1,a+1))
    return mesh(name,vv,ff)

def make_hems():
    flat_hem('R10_high_compact_left_collar_return',[(-.305,2.47),(-.37,2.22),(-.425,1.84),(-.515,1.52)],[.076,.074,.064,.038])
    flat_hem('R10_high_compact_right_collar_return',[(.305,2.47),(.37,2.22),(.418,1.78),(.395,1.40),(.252,1.01),(.055,.82)],[.086,.083,.079,.069,.053,.027],.024,.022)

def arm_field(side,kind):
    def deform(v,n,t,a):
        v=v.copy();front=max(0,-n.y)
        fold=0
        # Three long unequal cloth valleys bend with the covered arm. They
        # gather at the elbow, then broaden toward the outside of the sleeve.
        for j,(ang,h,w) in enumerate([(1.10,.022,.22),(2.12,.030,.28),(3.42,.017,.20)]):
            q=math.atan2(sin(a-ang-.58*t-side*.16),cos(a-ang-.58*t-side*.16))
            env=sin(pi*t)**1.3*(.62+.50*gauss(t-.66,.18))
            fold+=env*(h*gauss(q,w)-h*.48*gauss(q+w*.87,w*.45))
        fold+=.010*gauss(t-.85,.038)*(1+.21*cos(3*a+.4))
        v+=n*fold*(.25+.75*front)
        return v
    return deform

HAND_WRISTS={-1:Vector((-.655,-.465,1.275)),1:Vector((.710,-.440,1.205))}

def make_arms():
    for s in(-1,1):
        wrist=HAND_WRISTS[s]
        path=[(s*.36,.14,2.18),(s*.660,.06,2.055),(s*.925,.012,1.59),(s*1.005,-.075,1.055),(s*.85,-.285,1.105),tuple(wrist)]
        def sleeve(v,n,t,a,side=s):
            return arm_field(side,'upper' if t<.60 else 'fore')(v,n,t,a)
        # One continuous covered arm, with real wrist contact and no capped
        # elbow junction. Both exposed palms sit at the reference chest height.
        sweep('S165_R02_continuous_low_bent_covered_arm_'+str(s),path,[.080,.202,.205,.169,.128,.073],1.10,sides=50,steps=27,deform=sleeve)
        # A thick, folded outer cloak bears between shoulder and knee. This
        # fills the sleeve's cloth web in real3D; it is not a front ribbon or
        # an additional exposed circular arm pipe. Its closed ends are buried
        # in the chest and knee before the CPU union.
        rings=[];N=150;M=165
        for j in range(M+1):
            t=j/M;z=mix(.770,2.225,t)
            cx=profile([(0,.79),(.18,.86),(.43,.88),(.68,.80),(.86,.66),(1,.52)],t)
            rx=profile([(0,.13),(.18,.24),(.43,.29),(.68,.24),(.86,.15),(1,.070)],t)
            ry=profile([(0,.14),(.18,.25),(.43,.29),(.68,.24),(.86,.18),(1,.105)],t)
            cy=.075+.035*sin(pi*t)
            if s>0:cx+=.014*sin(pi*t);ry*=.96
            ring=[]
            for k in range(N):
                a=2*pi*k/N;sa=sin(a);ca=cos(a)
                x=s*(cx+rx*sa);y=cy-ry*ca;load=0
                for ii,(base,amp,ww) in enumerate([(-.55,.028,.22),(.12,.043,.29),(.72,.020,.19)]):
                    angle=base-.40*(1-t)+.18*sin(4.0*t+ii*.75+s*.30)
                    q=math.atan2(sin(a-angle),cos(a-angle))
                    env=sin(pi*t)**1.2*(.72+.40*gauss(t-.32,.23))
                    load+=env*(amp*gauss(q,ww)-amp*.46*gauss(q+ww*.94,ww*.44))
                nx=s*sa/max(.05,rx);ny=-ca/max(.05,ry);length=math.hypot(nx,ny)
                x+=nx/max(1e-9,length)*load;y+=ny/max(1e-9,length)*load
                ring.append((x,y,z))
            rings.append(ring)
        ob=ring_mesh('S165_R02_thick_weighted_outer_sleeve_cloak_'+str(s),rings)
        ob['clothConstruction']='Closed variable-depth garment bearing between shoulder and knee, integrated with the covered arm and torso. Unequal gathered planes wrap the entire front/side thickness.'

def make_hands():
    for s in (-1,1):
        wrist=HAND_WRISTS[s]
        tilt=math.radians(-7 if s<0 else 3);yaw=math.radians(8 if s<0 else -10)
        def pose(h,dy,dz):
            x=-s*h;y=dy;z=dz
            x,z=x*cos(tilt)+z*sin(tilt),-x*sin(tilt)+z*cos(tilt)
            x,y=x*cos(yaw)-y*sin(yaw),x*sin(yaw)+y*cos(yaw)
            return tuple(wrist+Vector((x,y,z)))
        rings=[]
        for j in range(51):
            t=j/50;z=.261*t;w=profile([(0,.060),(.20,.084),(.59,.104),(1,.092)],t);ring=[]
            for k in range(96):
                a=2*pi*k/96;h=w*sin(a);c=cos(a);depth=.056*(1-.20*smooth((t-.65)/.35));dy=-depth*c
                zz=z+.0055*cos((h+.070)*2*pi/.048)*smooth((t-.79)/.21)
                if c>0:
                    dy-=.012*gauss(h-.048,.042)*gauss(t-.36,.26)
                    dy-=.007*gauss(h+.043,.045)*gauss(t-.62,.25)
                    dy+=.0034*gauss(z-(.170+.19*h),.0055)*c*c
                    dy+=.0028*gauss(h-(.052-.08*z),.005)*gauss(z-.12,.065)*c*c
                ring.append(pose(h,dy,zz))
            rings.append(ring)
        ring_mesh('R08_cupped_anatomical_palm_'+str(s),rings)
        specs=[(-.073,.215,.055),(-.027,.267,.028),(.019,.291,.012)]
        for i,(h,length,bend)in enumerate(specs):
            pts=[pose(h,-.024,.245),pose(h-.005,-.020,.335),pose(h-.010,bend-.010,.256+length*.73),pose(h-.008,bend*.35-.012,.256+length)]
            def articulate(v,n,t,a):
                return v-n*(.0027*gauss(t-.42,.033)+.0021*gauss(t-.72,.027))
            sweep('R08_articulated_finger_'+str(s)+'_'+str(i),pts,[.025,.026,.021,.0105],.93,sides=22,steps=15,deform=articulate)
        index=[pose(.070,-.021,.245),pose(.110,-.009,.365),pose(.141,-.008,.347),pose(.135,-.017,.292),pose(.094,-.030,.272)]
        thumb=[pose(.071,-.005,.087),pose(.129,-.012,.145),pose(.136,-.023,.221),pose(.094,-.030,.272)]
        sweep('R08_touching_curled_index_'+str(s),index,[.026,.026,.023,.020,.013],.94,sides=22,steps=16)
        sweep('R08_opposing_thenar_thumb_'+str(s),thumb,[.039,.036,.028,.016],.96,sides=24,steps=16)

KNEE_FOLDS={}
# Knee field paths are stored left-to-right for the same cross-section lookup.
KNEE_FOLDS[-1]=[
 Fold([(-1.38,.535),(-1.10,.38),(-.58,.60),(.14,.835)],.024,.036,.1),
 Fold([(-1.36,.435),(-1.04,.245),(-.55,.405),(-.02,.745)],.021,.043,1.5),
 Fold([(-1.25,.355),(-.96,.205),(-.55,.33),(-.17,.635)],.017,.034,2.7)]
KNEE_FOLDS[1]=[
 Fold([(-.14,.805),(.43,.665),(1.04,.38),(1.37,.55)],.022,.039,.8),
 Fold([(-.015,.718),(.47,.455),(1.01,.235),(1.37,.445)],.026,.037,2.5),
 Fold([(.15,.61),(.51,.35),(.98,.215),(1.27,.35)],.018,.040,3.6)]

def leg_field(s):
    def deform(v,n,t,a):
        v=v.copy();front=max(0,-n.y)
        if front>0:
            v.y-=sum(f.field(v.x,v.z)for f in KNEE_FOLDS[s])*front**1.5
        return v
    return deform

def make_legs():
    leg_objects=[]
    for s in (-1,1):
        # Broad bent-knee wedge: a shaped thigh, knee and shrouded shin live
        # in one closed volume. A returning swept tube made the predecessor
        # look like two long inflated bars in the actual low reference view.
        rings=[];N=160;M=175
        for j in range(M+1):
            t=j/M;x=s*(.025+1.455*t)
            rz=profile([(0,.205),(.17,.237),(.40,.242),(.65,.232),(.83,.203),(.945,.131),(1,0)],t)
            ry=profile([(0,.335),(.18,.390),(.43,.409),(.68,.376),(.85,.300),(.95,.171),(1,0)],t)
            zc=profile([(0,.594),(.30,.603),(.60,.562),(.83,.505),(1,.480)],t)
            yc=profile([(0,-.112),(.24,-.087),(.62,-.027),(.85,.009),(1,.025)],t)
            if s>0:zc-=.023;yc-=.033;rz*=.965
            ring=[]
            for k in range(N):
                a=2*pi*k/N;ca=cos(a);sa=sin(a)
                # Slightly flatter bearing planes, round continuous knees.
                qz=math.copysign(abs(sa)**.87,sa)
                z=zc+rz*qz;y=yc-ry*ca
                front=max(0,ca)
                # Dominant broad folds descend from the inner lap and turn
                # gently round the knee. Their width and spacing vary.
                f=0
                for ii,(zz,depth,ww,bend) in enumerate([(.730,.027,.047,.092),(.604,.039,.057,.127),(.465,.024,.053,.096)]):
                    level=zz-bend*sin(pi*t*.92)+(.016 if s<0 else -.012)*sin(4*t+ii)
                    d=z-level;env=smooth((1-t)/.17)*smooth((t+.03)/.16)
                    f+=env*(depth*gauss(d,ww)-depth*.46*gauss(d+ww*.98,ww*.45))
                # A diagonal compression at the knee is subordinate to the
                # large mass. It is continuous around the upper front plane.
                f+=.016*gauss(z-(.74-.19*t),.035)*gauss(t-.72,.18)
                y-=f*front**1.45
                # Weighted folds also turn over the upper thickness of the
                # shrouded thigh toward the knee. These are real normal
                # displacements on the closed cross-section, so an oblique
                # camera does not reveal a smooth tube behind a front patch.
                load=0
                traces=[(1.15,.76,.029,.27),(.72,.52,.016,.21)] if s<0 else [(1.27,.89,.022,.31),(.81,.66,.031,.24)]
                for ii,(start,turn,amp,ww) in enumerate(traces):
                    angle=start-turn*t+.080*sin(3.6*t+ii*.7+s*.4)
                    q=math.atan2(sin(a-angle),cos(a-angle))
                    env=smooth(t/.15)*smooth((1-t)/.15)
                    load+=env*(amp*gauss(q,ww)-amp*.47*gauss(q+ww*.95,ww*.43))
                ny=-ca/max(.05,ry);nz=sa/max(.05,rz);length=math.hypot(ny,nz)
                y+=ny/max(1e-9,length)*load;z+=nz/max(1e-9,length)*load
                ring.append((x,y,z))
            rings.append(ring)
        ob=ring_mesh('S165_broad_weighted_crossed_knee_'+str(s),rings)
        ob['clothConstruction']='Authored closed variable cross-section leg volume; unequal broad fold planes are displaced directly in its continuous surface.'
        leg_objects.append(ob)
    # A restrained central buttock/garment core supports the hanging cloth;
    # the two bent legs retain separate knee silhouettes instead of one disc.
    core=ellipsoid('S165_pelvic_garment_bearing',(0,.035,.487),(.676,.346,.296),n=68,m=44)
    leg_objects.append(core)
    # The crossing ankles bear on a compact inner lap, forward of the broad
    # thighs. This is a local supporting volume, not an oval whole-leg disc.
    # It physically joins the old posed insteps, the new knees and apron.
    lap=ellipsoid('S165_inner_crossed_ankle_bearing',(0,-.385,.737),(.505,.274,.151),n=68,m=44)
    leg_objects.append(lap)
    # Each foot follows an ankle/heel/arch/ball path, rather than theR01
    # nearly straight narrow instep section that read as two stacked bars.
    for s in (-1,1):
        cy=-.550 if s<0 else -.640;cz=.815 if s<0 else .750
        path=[(s*.420,cy+.120,cz+.060),(s*.300,cy+.025,cz+.010),(s*.020,cy-.010,cz+.045),(-s*.235,cy-.035,cz+.015),(-s*.330,cy-.025,cz)]
        def instep(v,n,t,a):
            v=v.copy()
            if n.z<0:v.z+=.020*(-n.z)*sin(pi*t)
            return v
        sweep('S165_R02_curved_ankle_arch_ball_foot_'+str(s),path,[.045,.073,.066,.058,.028],1.20,sides=52,steps=24,deform=instep)
        for j in range(5):
            ellipsoid('S165_R02_rounded_toe_fan_'+str(s)+'_'+str(j),(-s*(.323+.010*(4-j)),cy-.105+.037*j,cz-.004-.002*j),(.058-.005*j,.028-.0015*j,.031-.002*j),n=28,m=18)
    # No separate knee patches: all visible cloth above is the existing
    # closed skin, so it stays coherent in the low three-quarter view.

def make_knee_drapes(underlying):
    """Carve weighted cloth directly into closed limb/core surfaces.

    Actual 3D geometry rays define only the local vertical contour range. The
    final geometry consists solely of displaced existing surface vertices;
    no sheath, flat return, sampled card, photograph or camera projection.
    """
    for ob in underlying:recalc(ob)
    bpy.context.view_layer.update();vv=[];ff=[]
    for ob in underlying:
        offset=len(vv);vv.extend(tuple(ob.matrix_world@v.co)for v in ob.data.vertices);ff.extend(tuple(offset+i for i in p.vertices)for p in ob.data.polygons)
    tree=BVHTree.FromPolygons(vv,ff,all_triangles=False);U=96;contours={}
    for s in(-1,1):
        columns=[]
        for i in range(U+1):
            u=i/U;x=s*(.285+1.165*u);z_hits=[]
            for j in range(161):
                z=.12+.98*j/160
                if tree.ray_cast(Vector((x,-2.5,z)),Vector((0,1,0)),5)[0]is not None:z_hits.append(z)
            if len(z_hits)<6:raise RuntimeError('Closed knee contour missing at x='+str(x))
            columns.append((z_hits[0],z_hits[-1]))
        contours[s]=columns
    for ob in underlying:
        world=ob.matrix_world.copy();inverse=world.inverted();normal_matrix=world.to_3x3().inverted().transposed();updates=[]
        for vert in ob.data.vertices:
            p=world@vert.co;s=-1 if p.x<0 else 1;u=(abs(p.x)-.285)/1.165
            if not(0<u<1):continue
            i=min(U-1,max(0,int(u*U)));q=u*U-i;lo=mix(contours[s][i][0],contours[s][i+1][0],q);hi=mix(contours[s][i][1],contours[s][i+1][1],q)
            v=(p.z-lo)/max(.05,hi-lo)
            if not(0<v<1):continue
            n=(normal_matrix@vert.normal).normalized();front=smooth((-n.y-.06)/.70)
            if front<=0:continue
            fan=0
            for ii,(fraction,power,height,width)in enumerate([(.30,.45,.022,.068),(.46,.42,.032,.074),(.63,.30,.028,.065),(.78,.16,.018,.054)]):
                line=fraction+power*(1-u)**.75+.018*sin(u*4.0+ii*.8+s*.4)*sin(pi*u)
                d=v-line;fan+=height*gauss(d,width)-height*.58*gauss(d+width*.85,width*.40)
            carved=sum(f.field(p.x,p.z)for f in KNEE_FOLDS[s]);hem=.007*gauss(v-.16,.034)-.005*gauss(v-.205,.019)
            envelope=smooth(u/.10)*smooth((1-u)/.12)*smooth(v/.12)*smooth((1-v)/.16)
            displacement=(1.10*carved+fan+hem)*envelope*front
            updates.append((vert,inverse@(p+n*displacement)))
        for vert,co in updates:vert.co=co
        ob.data.update();recalc(ob)
        ob['clothConstruction']='Fan folds and hem returns carved in the existing closed limb/core surface; no separate patch.'

def make_apron():
    vv=[];ff=[];U=70;V=130
    for back in (0,1):
        for j in range(V+1):
            t=j/V;z=mix(.330,.845,t);w=mix(.270,.200,t)
            for k in range(U+1):
                u=-1+2*k/U;x=u*w
                # Unequal converging pleats and a lifted, weighted hem.
                wave=.030*cos(2.15*pi*u+.23*t)+.010*cos(4.7*pi*u-.38*t)
                y=-.571-.090*t-wave*(1-.38*t)+back*.048
                zz=z+(.025*cos(2.15*pi*u)+.012*sin(4.7*u))*(1-t)**8
                vv.append((x,y,zz))
    size=(U+1)*(V+1)
    for b in range(2):
        for j in range(V):
            for k in range(U):
                a=b*size+j*(U+1)+k;q=(a,a+1,a+U+2,a+U+1);ff.append(q if not b else tuple(reversed(q)))
    for j in range(V):
        for k in (0,U):
            a=j*(U+1)+k;b=(j+1)*(U+1)+k;ff.append((a,b,b+size,a+size))
    for j in(0,V):
        for k in range(U):
            a=j*(U+1)+k;ff.append((a,a+size,a+size+1,a+1))
    return mesh('R08_weighted_asymmetric_apron_with_cast_hem',vv,ff)

def curve(name,points,radius,material,category='ornament'):
    return sweep(name,points,[radius,radius],1,material,10,8,category=category)

def ornament_leaf(name,center,angle,length,width,material):
    vv=[];ff=[];N=16;M=10
    for back in(0,1):
        for j in range(N+1):
            t=j/N;w=width*sin(pi*t)**.85
            for k in range(M+1):
                u=-1+2*k/M;dx=w*u;dz=length*t
                x=center[0]+dx*cos(angle)+dz*sin(angle);z=center[2]-dx*sin(angle)+dz*cos(angle)
                y=center[1]-.010*sin(pi*t)*(1-u*u)+back*.008
                vv.append((x,y,z))
    size=(N+1)*(M+1)
    for b in range(2):
        for j in range(N):
            for k in range(M):
                a=b*size+j*(M+1)+k;q=(a,a+1,a+M+2,a+M+1);ff.append(q if not b else tuple(reversed(q)))
    for j in range(N):
        for k in(0,M):
            a=j*(M+1)+k;b=(j+1)*(M+1)+k;ff.append((a,b,b+size,a+size))
    for j in(0,N):
        for k in range(M):
            a=j*(M+1)+k;ff.append((a,a+size,a+size+1,a+1))
    return mesh(name,vv,ff,material,'ornament')

def flower(name,x,z,r,material):
    cy=front_y(x,z)-.035
    for j in range(8):
        a=2*pi*j/8+.11
        ornament_leaf(name+'_petal_'+str(j),(x,cy,z),a,r*.98,r*.20,material)
    for j in range(6):
        a=2*pi*j/6+.37
        ornament_leaf(name+'_inner_'+str(j),(x,cy-.007,z),a,r*.55,r*.12,material)
    ellipsoid(name+'_raised_seed',(x,cy-.015,z),(.019,.012,.024),material,n=24,m=16,category='ornament')

def make_ornaments(material):
    flower('R08_layered_lotus_pectoral',-.012,1.958,.088,material)
    for s in(-1,1):
        ps=[]
        for i in range(31):
            t=i/30;x=s*(.01+.285*t);z=1.966+.325*t*t;ps.append((x,front_y(x,z)-.022,z))
        curve('R08_fine_link_pectoral_chain_'+str(s),ps,.0052,material)
    for i in range(9):
        t=i/8;x=.319-.358*t+.018*sin(t*5);z=1.846-.872*t
        flower('R08_small_robe_floral_relief_'+str(i),x,z,.020+.004*sin(i*1.9),material)

def petal(name,angle,z0,height,r0,width,twist,material,tip_offset=.35):
    vv=[];ff=[];N=42;M=22
    widths=[(0,.010),(.13,.060),(.28,.58),(.50,1),(.73,.79),(.90,.32),(1,0)]
    for back in(0,1):
        for j in range(N+1):
            t=j/N;half=width*profile(widths,t);z=z0+height*t
            r=profile([(0,r0),(.13,r0+.29),(.35,r0+.47),(.70,r0+.50),(1,r0+tip_offset)],t)
            a=angle+twist*(t-.25)
            for k in range(M+1):
                u=-1+2*k/M
                # Shallow lanceolate blade, rolled edge, real thin back shell.
                cup=.011*(1-u*u)*sin(pi*t)
                edge=-.008*gauss(abs(u)-.90,.10)*sin(pi*t)
                rib=.0055*gauss(u,.065)*sin(pi*t)
                fine=0
                for branch in(.23,.42,.60):
                    d=t-(branch+.24*abs(u));fine-=.0024*gauss(d,.010)*smooth(abs(u)/.12)*smooth((.96-abs(u))/.15)
                rad=r+cup+edge+rib+fine-back*.008
                tangent=half*u
                vv.append((rad*sin(a)+tangent*cos(a),-rad*cos(a)+tangent*sin(a),z+.020*u*u*sin(pi*t)))
    size=(N+1)*(M+1)
    for b in range(2):
        for j in range(N):
            for k in range(M):
                a=b*size+j*(M+1)+k;q=(a,a+1,a+M+2,a+M+1);ff.append(q if not b else tuple(reversed(q)))
    for j in range(N):
        for k in(0,M):
            a=j*(M+1)+k;b=(j+1)*(M+1)+k;ff.append((a,b,b+size,a+size))
    for j in(0,N):
        for k in range(M):
            a=j*(M+1)+k;ff.append((a,a+size,a+size+1,a+1))
    return mesh(name,vv,ff,material,'lotus')

def make_lotus(materials):
    rings=[];N=160
    for j in range(52):
        t=j/51;z=mix(-.40,.215,t);r=profile([(0,.97),(.16,1.13),(.43,1.225),(.78,1.21),(1,1.125)],t);ring=[]
        for k in range(N):
            a=2*pi*k/N;rr=r+.012*cos(20*a+.4*t)*sin(pi*t)
            ring.append((rr*sin(a),-rr*cos(a),z))
        rings.append(ring)
    ring_mesh('R08_lotus_shallow_receptacle',rings,materials[1],'lotus')
    for row,count in enumerate((20,22)):
        for i in range(count):
            a=2*pi*(i+.47*row)/count+.006*sin(i*2.1)
            h=(.735 if not row else .705)*(1+.035*sin(i*1.4+row))
            z=-.455 if not row else -.135
            r=.995 if not row else .890
            w=(.235 if not row else .205)*(1+.055*sin(i*1.3))
            petal('R09_pointed_overlapping_lotus_%d_%02d'%(row,i),a,z,h,r,w,.080*sin(i*1.7),materials[(i+row)%len(materials)],.35 if not row else .14)
