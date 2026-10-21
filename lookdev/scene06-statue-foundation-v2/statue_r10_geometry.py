"""R10 reference-pose arms, compact collar and blended weighted garment.

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
        # Broad folded plane with an incised return; no separate tubular rib.
        return env*(h*gauss(d,w)-h*.58*gauss(d+w*.92,w*.39))

FOLDS=[
 Fold([(-.53,1.97),(-.30,1.77),(.16,1.92),(.43,2.19)],.026,.033,.2),
 Fold([(-.56,1.82),(-.35,1.62),(.13,1.73),(.47,2.055)],.029,.042,1.2),
 Fold([(-.565,1.665),(-.24,1.455),(.15,1.57),(.48,1.935)],.031,.037,2.1),
 Fold([(-.57,1.54),(-.30,1.30),(.11,1.40),(.49,1.79)],.026,.048,2.9),
 Fold([(-.56,1.405),(-.27,1.17),(.16,1.26),(.47,1.665)],.034,.040,.8),
 Fold([(-.54,1.265),(-.34,1.07),(.12,1.105),(.44,1.52)],.023,.043,3.7),
 Fold([(-.53,1.14),(-.22,.955),(.18,1.025),(.42,1.37)],.029,.047,4.2),
 Fold([(-.49,1.015),(-.21,.87),(.12,.91),(.36,1.20)],.022,.039,5.1),
]
WIDTH=[(.67,.44),(.87,.50),(1.15,.58),(1.46,.65),(1.77,.70),(1.98,.72),(2.23,.65),(2.40,.44),(2.51,.285),(2.60,.265)]
DEPTH=[(.67,.27),(.87,.31),(1.15,.345),(1.46,.36),(1.77,.35),(1.98,.31),(2.23,.275),(2.40,.227),(2.51,.204),(2.60,.20)]

def cloth_height(x,z):
    h=sum(f.field(x,z)for f in FOLDS)
    for i in range(5):
        zz=clamp((z-.84)/1.40);xp=.325+i*.061+.040*sin(zz*2.4+i*.5)-.018*(1-zz)
        env=smooth((z-.82)/.20)*smooth((2.26-z)/.18)
        h+=env*(.013*gauss(x-xp,.015)-.009*gauss(x-xp+.022,.009))
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
        if kind=='upper':
            fold=.010*cos(4.4*a+1.4*t+side*.4)*sin(pi*t)**1.4+.007*sin(8*a-2.0*t)*gauss(t-.76,.16)
        else:
            fold=.013*cos(5.2*a-3.0*t+side*.6)*sin(pi*t)**1.4
            fold+=.010*gauss(t-.88,.028)*(1+.23*sin(3*a))
        v+=n*fold*(.25+.75*front)
        return v
    return deform

HAND_WRISTS={-1:Vector((-.655,-.465,1.275)),1:Vector((.710,-.440,1.205))}

def make_arms():
    for s in(-1,1):
        wrist=HAND_WRISTS[s]
        path=[(s*.36,.14,2.18),(s*.650,.06,2.055),(s*.825,.012,1.54),(s*.845,-.075,1.015),(s*.80,-.285,1.105),tuple(wrist)]
        def sleeve(v,n,t,a,side=s):
            return arm_field(side,'upper' if t<.60 else 'fore')(v,n,t,a)
        # One continuous covered arm, with real wrist contact and no capped
        # elbow junction. Both exposed palms sit at the reference chest height.
        sweep('R10_continuous_low_bent_covered_arm_'+str(s),path,[.080,.202,.190,.158,.123,.073],1.10,sides=50,steps=27,deform=sleeve)

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
        leg_objects.append(sweep('R09_continuous_bent_thigh_knee_shin_'+str(s),[(s*.24,.12,.845),(s*.78,.035,.715),(s*1.225,-.075,.535),(s*1.255,-.285,.510),(s*.88,-.465,.625),(s*.37,-.535,.755),(-s*.17,-.535,.823)],[.190,.232,.229,.205,.164,.103,.058],1.22,sides=64,steps=24))
    # A restrained central buttock/garment core supports the hanging cloth;
    # the two bent legs retain separate knee silhouettes instead of one disc.
    core=ellipsoid('R09_lower_garment_support_core',(0,.055,.475),(.665,.345,.300),n=68,m=44)
    leg_objects.append(core)
    # Distinct feet have curved insteps, thinner soles and a rounded toe fan.
    # They replace the previous nearly constant-section horizontal foot bars.
    for s in (-1,1):
        cy=-.525 if s<0 else -.655;cz=.844 if s<0 else .775
        rings=[]
        for j in range(91):
            t=j/90;x=s*(.345-.625*t);y=cy+.020*(1-t)-.018*t
            rz=profile([(0,0),(.065,.048),(.18,.078),(.49,.049),(.80,.034),(1,.014)],t)
            ry=profile([(0,0),(.065,.057),(.20,.078),(.52,.111),(.80,.101),(1,.057)],t)
            z=cz+.043*(1-t);ring=[]
            for k in range(52):
                a=2*pi*k/52;c=cos(a);yy=y+ry*sin(a);zz=z+(rz if c>0 else .024)*c
                if c>0:
                    zz+=.0045*gauss(yy-(cy-.041),.014)*gauss(t-.47,.22)*c
                    zz+=.0032*gauss(yy-(cy+.017),.013)*gauss(t-.52,.21)*c
                ring.append((x,yy,zz))
            rings.append(ring)
        ring_mesh('R10_crossed_anatomical_instep_foot_'+str(s),rings)
        for j in range(5):
            ellipsoid('R10_separate_rounded_toe_'+str(s)+'_'+str(j),(-s*(.249+.007*(4-j)),cy-.078+.035*j,cz+.004-.003*j),(.049-.004*j,.029-.002*j,.027-.0018*j),n=28,m=18)
    make_knee_drapes(leg_objects)

def make_knee_drapes(underlying):
    """Cast folded cloth over actual limb geometry, with buried closed backs.

    Geometry rays sample the authored 3D volumes only. No reference pixels,
    depth image, texture or scene camera participate in this construction.
    """
    bpy.context.view_layer.update();vv=[];ff=[]
    for ob in underlying:
        offset=len(vv);vv.extend(tuple(ob.matrix_world@v.co)for v in ob.data.vertices);ff.extend(tuple(offset+i for i in p.vertices)for p in ob.data.polygons)
    tree=BVHTree.FromPolygons(vv,ff,all_triangles=False)
    U=72;V=106
    for s in(-1,1):
        columns=[]
        for i in range(U+1):
            u=i/U;x=s*(.285+1.165*u);hits=[]
            for j in range(161):
                z=.12+.98*j/160;hit=tree.ray_cast(Vector((x,-2.5,z)),Vector((0,1,0)),5)[0]
                if hit is not None:hits.append((z,hit.y))
            if len(hits)<6:raise RuntimeError('Draped knee support missing at x='+str(x))
            columns.append({'x':x,'hits':hits,'lo':hits[0][0]+.013,'hi':hits[-1][0]-.014})
        # Smooth the sampled boundary at the scale of the casting, while its
        # interior continues to follow the underlying bent limb surfaces.
        raw_lo=[c['lo']for c in columns];raw_hi=[c['hi']for c in columns]
        for _ in range(3):
            lo=[c['lo']for c in columns];hi=[c['hi']for c in columns]
            for i in range(1,U):columns[i]['lo']=max(raw_lo[i],(lo[i-1]+2*lo[i]+lo[i+1])/4);columns[i]['hi']=min(raw_hi[i],(hi[i-1]+2*hi[i]+hi[i+1])/4)
        verts=[];faces=[]
        for back in(0,1):
            for i,c in enumerate(columns):
                u=i/U;zs=[h[0]for h in c['hits']]
                for j in range(V+1):
                    v=j/V;z=mix(c['lo'],c['hi'],v);k=min(len(zs)-2,max(0,bisect.bisect_right(zs,z)-1));q=clamp((z-zs[k])/max(1e-8,zs[k+1]-zs[k]));base=mix(c['hits'][k][1],c['hits'][k+1][1],q)
                    carved=sum(f.field(c['x'],z)for f in KNEE_FOLDS[s])
                    fan=0
                    for ii,(base,power,height,width)in enumerate([(.30,.45,.019,.065),(.46,.42,.027,.070),(.63,.30,.024,.060),(.78,.16,.016,.050)]):
                        line=base+power*(1-u)**.75+.018*sin(u*4.0+ii*.8+s*.4)*sin(pi*u)
                        d=v-line;fan+=height*gauss(d,width)-height*.58*gauss(d+width*.85,width*.40)
                    envelope=smooth(u/.10)*smooth((1-u)/.12)*smooth(v/.14)*smooth((1-v)/.20)
                    # Zero relief at the sampled boundary joins the sheath
                    # continuously into the limb; no serrated upper patch seam.
                    lift=max(0,.007+1.10*carved+fan)*envelope
                    lift+=.008*gauss(v-.15,.040)*envelope
                    y=base+.018 if back else base-lift
                    verts.append((c['x'],y,z))
        size=(U+1)*(V+1)
        for b in range(2):
            for i in range(U):
                for j in range(V):
                    a=b*size+i*(V+1)+j;q=(a,a+1,a+V+2,a+V+1);faces.append(q if not b else tuple(reversed(q)))
        for i in range(U):
            for j in(0,V):
                a=i*(V+1)+j;b=(i+1)*(V+1)+j;faces.append((a,b,b+size,a+size))
        for i in(0,U):
            for j in range(V):
                a=i*(V+1)+j;faces.append((a,a+size,a+size+1,a+1))
        mesh('R09_weighted_knee_robe_shell_with_rolled_hems_'+str(s),verts,faces)

def make_apron():
    vv=[];ff=[];U=70;V=130
    for back in (0,1):
        for j in range(V+1):
            t=j/V;z=mix(.17,.825,t);w=mix(.365,.225,t)
            for k in range(U+1):
                u=-1+2*k/U;x=u*w
                # Unequal converging pleats and a lifted, weighted hem.
                wave=.017*cos(2.6*pi*u+.16*t)+.009*cos(5.3*pi*u-.30*t)+.005*sin(8.7*u+t)
                y=-.615-.050*(1-t)-wave*(1-.42*t)+back*.022
                zz=z+(.020*cos(2.6*pi*u)+.009*sin(5.2*u))*(1-t)**10
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
