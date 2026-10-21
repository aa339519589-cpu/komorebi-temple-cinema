"""Independent, editable Japanese Buddha foundation. Run through the shared queue.

This is newly modeled geometry informed by the seven CC0 museum reference views
and the supplied scene silhouette. It contains no scan-derived Gandharan head,
photographic displacement, projected image, baked illumination, or replacement
frame. It is an unaccepted foundation candidate, not a reproduction claim.
"""
import bpy, bmesh, math, json, hashlib, os
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi, exp, sqrt

OUT=Path(__file__).resolve().parent
REV=os.environ.get('STATUE_REVISION','r02')
DEST=OUT/REV; DEST.mkdir(exist_ok=True,parents=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
SCENE=bpy.context.scene
SCULPT=bpy.data.collections.new('NEW_JAPANESE_FOUNDATION_'+REV)
SCENE.collection.children.link(SCULPT)
parts=[]

def gauss(v,s): return exp(-.5*(v/s)**2)
def clamp(v,a=0,b=1): return max(a,min(b,v))
def mix(a,b,t): return a+(b-a)*t
def smooth(t): t=clamp(t);return t*t*(3-2*t)
def profile(keys,t):
    if t<=keys[0][0]:return keys[0][1]
    if t>=keys[-1][0]:return keys[-1][1]
    slopes=[(keys[i+1][1]-keys[i][1])/(keys[i+1][0]-keys[i][0])for i in range(len(keys)-1)]
    deriv=[slopes[0]]
    for i in range(1,len(keys)-1):
        a,b=slopes[i-1],slopes[i]
        deriv.append(0 if a*b<=0 else 2*a*b/(a+b))
    deriv.append(slopes[-1])
    for i,((a,x),(b,y)) in enumerate(zip(keys,keys[1:])):
        if a<=t<=b:
            u=(t-a)/(b-a);h=b-a
            return (2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*h*deriv[i]+(-2*u**3+3*u*u)*y+(u**3-u*u)*h*deriv[i+1]

def rgb(text):
    a=[int(text[k:k+2],16)/255 for k in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)

def material(name,color,metallic,roughness):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=rgb(color)
    p.inputs['Metallic'].default_value=metallic
    p.inputs['Roughness'].default_value=roughness
    return m

gold=material('New warm gold leaf — uniform physical material','d4a84d',.94,.35)
darkgold=material('Fine carved gold recesses','987033',.91,.38)
hairmat=material('Dark lacquered spiral curls','211b12',.38,.40)
brightgold=material('Burnished petal edges and jewels','dfb958',.96,.25)
clay=material('Geometry review clay','b8aaa0',0,.58)

def mesh(name,verts,faces,mat=gold,collection=SCULPT):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);collection.objects.link(ob)
    if mat:me.materials.append(mat)
    for f in me.polygons:f.use_smooth=True
    parts.append(ob);return ob

def ellipsoid(name,center,scale,mat=gold,n=48,m=24):
    verts=[];faces=[]
    for j in range(m+1):
        v=pi*j/m
        for k in range(n):
            a=2*pi*k/n
            verts.append((scale[0]*sin(v)*cos(a),scale[1]*sin(v)*sin(a),scale[2]*cos(v)))
    for j in range(m):
        for k in range(n):
            a=j*n+k;b=j*n+(k+1)%n;faces.append((a,a+n,b+n,b))
    ob=mesh(name,verts,faces,mat);ob.location=center;return ob

def catmull(points,steps=12):
    ps=[Vector(p)for p in points];out=[]
    for i in range(len(ps)-1):
        p0=ps[max(0,i-1)];p1=ps[i];p2=ps[i+1];p3=ps[min(len(ps)-1,i+2)]
        for j in range(steps):
            t=j/steps
            out.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
    out.append(ps[-1]);return out

def sweep(name,points,radii,mat=gold,sides=16,steps=10,aspect=1):
    path=catmull(points,steps);verts=[];faces=[]
    for j,p in enumerate(path):
        t=j/(len(path)-1)
        rr=profile([(i/(len(radii)-1),v)for i,v in enumerate(radii)],t)
        tangent=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized()
        axis=Vector((0,1,0))
        if abs(axis.dot(tangent))>.95:axis=Vector((1,0,0))
        b=tangent.cross(axis).normalized();c=tangent.cross(b).normalized()
        for k in range(sides):
            a=2*pi*k/sides;v=p+rr*(b*cos(a)+c*sin(a)*aspect);verts.append(tuple(v))
    for j in range(len(path)-1):
        for k in range(sides):
            a=j*sides+k;b=j*sides+(k+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.append(tuple(range(sides-1,-1,-1)))
    faces.append(tuple((len(path)-1)*sides+k for k in range(sides)))
    return mesh(name,verts,faces,mat)

def curve(name,points,radius,mat=gold):return sweep(name,points,[radius,radius],mat,8,4)

def close_rings(name,rings,mat=gold):
    n=len(rings[0]);verts=[v for ring in rings for v in ring];faces=[]
    for j in range(len(rings)-1):
        for k in range(n):
            a=j*n+k;b=j*n+(k+1)%n;faces.append((a,b,b+n,a+n))
    faces.append(tuple(range(n-1,-1,-1)));faces.append(tuple((len(rings)-1)*n+k for k in range(n)))
    return mesh(name,verts,faces,mat)

# Head: a new closed loft with anatomical displacement confined to its front.
# Width/depth sections follow the broad Heian/Jōchō face seen in the museum's
# front, three-quarter and profile photographs. The target is slightly longer.
FACE_Z0=2.60; FACE_Z1=3.39
WIDTH=[(0,.135),(.06,.220),(.18,.282),(.40,.335),(.62,.348),(.85,.338),(1,.313)]
DEPTH=[(0,.162),(.13,.199),(.35,.241),(.58,.255),(.84,.249),(1,.223)]

def face_features(x,z):
    v=0.0
    # Malar volume, soft lower cheeks and bounded ocular hollows.
    for s in (-1,1):
        v+=.037*gauss(x-s*.188,.105)*gauss(z-2.985,.105)
        v+=.015*gauss(x-s*.18,.114)*gauss(z-2.823,.112)
        v-=.027*gauss(x-s*.157,.101)*gauss(z-3.139,.054)
        a=(s*x-.055)/.228
        if 0<a<1:
            eye=3.118+.006*a+.012*sin(pi*a)
            brow=3.207+.046*sin(pi*a)-.019*a
            end=sin(pi*a)**.55
            v+=.027*end*gauss(z-(eye+.020),.017)
            v+=.011*end*gauss(z-(eye-.012),.015)
            v-=.016*end*gauss(z-eye,.0034)
            v+=.027*end*gauss(z-brow,.020)
            v-=.008*end*gauss(z-(brow-.022),.009)
    # Nose: tapering root, fleshy tip, alar wings and two real incised nostrils.
    v+=.072*gauss(x,.043)*gauss(z-3.113,.120)
    v+=.067*gauss(x,.049)*gauss(z-3.012,.035)
    v+=.026*gauss(x,.021)*gauss(z-2.980,.030)
    for s in (-1,1):
        v+=.036*gauss(x-s*.052,.025)*gauss(z-2.997,.024)
        v-=.024*gauss(x-s*.046,.013)*gauss(z-2.983,.007)
        v-=.010*gauss(x-s*.080,.011)*gauss(z-2.990,.026)
    # Short philtrum, quiet Cupid's bow and a fuller lower lip.
    v+=.014*gauss(x,.114)*gauss(z-2.887,.065)
    v-=.006*gauss(x,.012)*gauss(z-2.944,.025)
    for s in (-1,1):v+=.005*gauss(x-s*.024,.010)*gauss(z-2.943,.025)
    u=x/.107
    if abs(u)<1.4:
        end=exp(-(abs(u)/.95)**6)
        seam=2.878+.009*min(1,u*u)
        upper=2.897+.004*gauss(abs(x)-.033,.017)-.006*gauss(x,.012)
        v+=.015*end*gauss(z-upper,.010)
        v+=.023*end*gauss(z-2.858,.014)
        v-=.012*end*gauss(z-seam,.0035)
    for s in (-1,1):v-=.009*gauss(x-s*.104,.009)*gauss(z-2.888,.013)
    v-=.008*gauss(x,.090)*gauss(z-2.812,.015)
    v+=.024*gauss(x,.142)*gauss(z-2.746,.057)
    return v

rings=[]
for j in range(205):
    t=j/204;z=mix(FACE_Z0,FACE_Z1,t);w=profile(WIDTH,t);d=profile(DEPTH,t);ring=[]
    for k in range(256):
        a=2*pi*k/256;x=w*sin(a);front=cos(a)
        yc=.025+.015*gauss(t-.90,.2)
        y=yc-d*front
        if front>0:y-=face_features(x,z)*front**2
        ring.append((x,y,z))
    rings.append(ring)
head=close_rings('01_New_Heian_face_closed_anatomical_loft',rings)
head['source']='New geometry; museum multi-view inspired, manually parameterized; not a museum scan.'

# Urna is a low, smooth pearl set into the forehead, not a large bullseye.
ellipsoid('02_Urna_low_pearl',(0,-.242,3.278),(.019,.010,.019),brightgold,32,16)

# Ears have a thin broad pinna, concha depression and extended fleshy lobes.
for s in (-1,1):
    rr=[]
    for j in range(35):
        q=j/34;ring=[]
        for k in range(100):
            a=2*pi*k/100
            xx=.366+q*(.082*sin(a)+.009)
            zz=3.023+q*(.226*cos(a)-.027*(1-cos(a)))
            yy=-.018-.032*gauss(q-.88,.15)+.007*gauss(q-.30,.22)
            ring.append((s*xx,yy,zz))
        rr.append(ring)
    ear=close_rings('03_'+('R'if s<0 else'L')+'_ear_concha_helix',rr)
    solid=ear.modifiers.new('Anatomical pinna thickness','SOLIDIFY');solid.thickness=.019
    ellipsoid('03_Fleshy_pinna_back_'+str(s),(s*.375,.001,3.010),(.052,.047,.222),gold,40,28)
    ellipsoid('03_elongated_ear_lobe_'+str(s),(s*.375,-.023,2.771),(.048,.050,.080),gold,36,24)
    curve('03_ear_antihelix_'+str(s),[(s*.377,-.049,2.82),(s*.392,-.060,2.94),(s*.399,-.064,3.08),(s*.369,-.058,3.16)],.012)

# Neck joins the jaw and shoulders with three subdued incised rings.
rr=[]
for j in range(75):
    t=j/74;z=mix(2.32,2.57,t);ring=[]
    w=.25+.014*gauss(t-.1,.2);d=.190+.01*gauss(t-.1,.3)
    for k in range(128):
        a=2*pi*k/128;x=w*sin(a);y=.055-d*cos(a)
        if cos(a)>0:
            for z0 in (2.389,2.443,2.497):y+=.007*gauss(z-z0,.007)*cos(a)**3
        ring.append((x,y,z))
    rr.append(ring)
close_rings('04_Neck_three_carved_rings',rr)

# Dark hair cap follows the skull rather than sitting as a separate bead hat.
capverts=[];capfaces=[]
for j in range(37):
    t=j/36;v=.05+(pi/2-.05)*t
    for k in range(100):
        a=2*pi*k/100
        capverts.append((.369*cos(v)*sin(a),.029-.283*cos(v)*cos(a),3.305+.285*sin(v)))
for j in range(36):
    for k in range(100):
        a=j*100+k;b=j*100+(k+1)%100;capfaces.append((a,b,b+100,a+100))
mesh('05_Hair_dark_continuous_cap',capverts,capfaces,hairmat)
ellipsoid('05_Low_ushnisha',(0,.027,3.554),(.145,.129,.112),hairmat)

# Every curl is a small sculpted spiral with tangent relief. All spiral geometry
# is collected in one mesh to keep a browser export practical.
cv=[];cf=[];curlcount=0
def spiral(center,normal,radius):
    global curlcount
    n=Vector(normal).normalized();e=n.cross(Vector((0,0,1)))
    if e.length<.05:e=Vector((1,0,0))
    e.normalize();f=n.cross(e).normalized();origin=Vector(center);N=38;K=6;base=len(cv)
    for j in range(N):
        t=j/(N-1);a=2*pi*1.5*t;r=radius*(1-.81*t)
        p=origin+e*(cos(a)*r)+f*(sin(a)*r)+n*(.004+.006*t)
        tangent=(-e*sin(a)+f*cos(a)).normalized();b=tangent.cross(n).normalized()
        for k in range(K):
            h=2*pi*k/K;cv.append(tuple(p+.0060*(n*cos(h)+b*sin(h))))
    for j in range(N-1):
        for k in range(K):
            a=base+j*K+k;b=base+j*K+(k+1)%K;cf.append((a,b,b+K,a+K))
    curlcount+=1
for row in range(8):
    v=.075+row*.165;count=max(8,round(2*pi*.365*cos(v)/.050))
    for k in range(count):
        a=2*pi*(k+.5*(row%2))/count
        c=(.373*cos(v)*sin(a),.029-.287*cos(v)*cos(a),3.305+.289*sin(v))
        n=(sin(a)*cos(v)/.373,-cos(a)*cos(v)/.287,sin(v)/.289)
        spiral(c,n,.021)
for row in range(4):
    v=.1+row*.36;count=max(7,round(2*pi*.144*cos(v)/.045))
    for k in range(count):
        a=2*pi*(k+.5*(row%2))/count;c=(.146*cos(v)*sin(a),.027-.131*cos(v)*cos(a),3.554+.114*sin(v))
        spiral(c,(sin(a)*cos(v)/.146,-cos(a)*cos(v)/.131,sin(v)/.114),.019)
mesh('05_'+str(curlcount)+'_individual_spiral_curls',cv,cf,hairmat)

# A compact neck and lowered head give the quiet, weighted seated silhouette.
# Do not translate the separately modeled neck a second time.
for ob in list(SCULPT.objects):
    if ob.name.startswith(('01_','02_','03_','05_')):
        ob.location.z-=.10

# Continuous torso robe. Cowl folds are modeled within the surface, with their
# incised valleys and rounded ridges sharing the same vertices as the garment.
BODY_WIDTH=[(.69,.47),(.90,.60),(1.18,.67),(1.52,.75),(1.89,.82),(2.12,.83),(2.28,.68),(2.40,.36),(2.47,.265)]
BODY_DEPTH=[(.69,.31),(.90,.37),(1.18,.38),(1.52,.37),(1.89,.35),(2.12,.32),(2.28,.26),(2.40,.22),(2.47,.194)]
def robe_fold(x,z):
    v=0
    for i in range(10):
        low=1.020+i*.106+.008*sin(i*1.7)
        path=low+.66*((x+.19)/.94)**2
        # The curve sweeps upward to the left shoulder in body coordinates.
        env=gauss(x+.03,.63)*smooth((2.30-z)/.16)*smooth((z-.76)/.18)
        width=.022+i*.0005
        v+=env*(.020*gauss(z-path,width)-.007*gauss(z-(path-.032),.014))
    # Weighted vertical fold ribbon on the viewer's right shoulder.
    for i in range(6):
        xp=.39+i*.061-.095*(2.35-z)
        v+=.018*gauss(x-xp,.012)*smooth((z-.82)/.17)*smooth((2.40-z)/.16)
    return v
rr=[]
for j in range(255):
    z=mix(.69,2.47,j/254);w=profile(BODY_WIDTH,z);d=profile(BODY_DEPTH,z);ring=[]
    for k in range(256):
        a=2*pi*k/256;x=w*sin(a);front=cos(a);y=.095-d*front
        if front>0:y-=robe_fold(x,z)*front**2
        if front<0:
            y+=.016*sin(11*a+2*z)*gauss(z-1.5,.65)*(-front)**2
        ring.append((x,y,z))
    rr.append(ring)
close_rings('06_Continuous_torso_robe_with_carved_cowl_folds',rr)

# Draped shoulder bands and full sleeves have real arm volume and folded cuffs.
for s in (-1,1):
    sweep('07_Sleeved_upper_arm_'+str(s),[(s*.49,.09,2.21),(s*.78,.06,2.04),(s*.96,.015,1.65),(s*1.00,-.005,1.22)], [.18,.26,.235,.19],gold,48,24,1.1)
    sweep('07_Raised_forearm_'+str(s),[(s*.99,-.005,1.22),(s*.91,-.24,1.36),(s*.76,-.48,1.59),(s*.646,-.60,1.81)],[.195,.18,.14,.088],gold,40,22,1.08)
    # A wide sleeve drape sweeps from shoulder to elbow with curved incisions.
    for j in range(6):
        z0=2.20-j*.106
        pts=[(s*(.72+.03*j/7),-.166,z0),(s*(.87+.04*j/7),-.202,z0-.19),(s*(.99+.03*j/7),-.174,z0-.48)]
        curve('07_Sleeve_soft_carved_fold_'+str(s)+'_'+str(j),pts,.009+(.002 if j%3==0 else 0))
    # The shoulder border is a broad folded ribbon, rather than a cable.
    sweep('07_Robe_shoulder_border_'+str(s),[(s*.36,-.11,2.38),(s*.41,-.23,2.20),(s*.43,-.31,1.91),(s*.48,-.34,1.62)], [.044,.049,.044,.027],gold,14,18,.50)

# Raised palms are gently cupped. Three long fingers and the thumb–index loop
# are independently editable before the hand-only voxel weld.
for s in (-1,1):
    handparts=[];start=len(parts);cx=s*.619;cy=-.664
    rr=[]
    for j in range(44):
        t=j/43;z=mix(1.76,2.045,t);w=profile([(0,.068),(.22,.105),(.60,.116),(1,.101)],t);ring=[]
        for k in range(80):
            a=2*pi*k/80;x=cx+w*sin(a);y=cy-.064*cos(a)
            if cos(a)>0:y+=.009*gauss(t-.52,.21)*cos(a)**2
            ring.append((x,y,z))
        rr.append(ring)
    palm=close_rings('08_Palm_'+str(s),rr)
    def hp(dx,dy,z):return(cx+s*dx,cy+dy,z)
    for i,(dx,length) in enumerate([(-.069,.223),(-.018,.286),(.032,.264)]):
        sweep('08_Long_finger_'+str(s)+'_'+str(i),[hp(dx,0,2.008),hp(dx-.011,-.003,2.10),hp(dx-.018,-.014,2.008+length*.79),hp(dx-.017,-.027,2.008+length)], [.030,.029,.023,.013],gold,20,12,.92)
    # Thumb and index touch at a small ring; openings are actual empty space.
    sweep('08_Curled_index_'+str(s),[hp(.081,0,2.015),hp(.123,-.003,2.135),hp(.167,-.008,2.115),hp(.166,-.020,2.053),hp(.114,-.038,2.025)],[.030,.028,.026,.022,.014],gold,20,14,.96)
    sweep('08_Opposing_thumb_'+str(s),[hp(.083,-.004,1.855),hp(.147,-.010,1.921),hp(.153,-.030,1.987),hp(.114,-.038,2.025)],[.043,.038,.031,.018],gold,20,14,.95)
    handparts=parts[start:]
    # Weld only the hand. This preserves the space enclosed by the mudra ring.
    bpy.ops.object.select_all(action='DESELECT')
    for ob in handparts:ob.select_set(True)
    bpy.context.view_layer.objects.active=palm;bpy.ops.object.join()
    palm.name='08_Unified_raised_mudra_hand_'+str(s)
    rem=palm.modifiers.new('Fused palm and anatomical fingers','REMESH');rem.mode='VOXEL';rem.voxel_size=.0052;rem.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=rem.name)
    sm=palm.modifiers.new('Gentle sculpt smoothing','SMOOTH');sm.factor=.30;sm.iterations=2
    bpy.ops.object.modifier_apply(modifier=sm.name)
    parts=parts[:start]+[palm]
    # Delicate palm creases and finger flexion marks stay gold in shadow.
    for j,pts in enumerate([
        [hp(-.079,-.063,1.968),hp(-.025,-.069,1.944),hp(.039,-.067,1.951)],
        [hp(.073,-.058,1.994),hp(.038,-.067,1.920),hp(.054,-.057,1.866)],
    ]):curve('08_Palm_carved_line_'+str(s)+'_'+str(j),pts,.0028,darkgold)

# Lower robe is an oblate closed volume with bent knee bulges and actual folded
# ridges. It replaces the old long, uniform sausage-shaped crossed legs.
verts=[];faces=[];N=256;M=96
for j in range(M+1):
    v=pi*j/M
    for k in range(N):
        a=2*pi*k/N;x=1.51*sin(v)*cos(a);y=.035+.625*sin(v)*sin(a);z=.475+.360*cos(v)+.096*gauss(abs(x)-1.09,.34)*sin(v)
        if y<.04:
            env=clamp((.04-y)/.55)
            y-=.065*gauss(abs(x)-1.12,.28)*env
            # Knee robe fans follow the bend of the seated leg.
            for s in (-1,1):
                for i in range(4):
                    line=.29+i*.082+.135*((s*x-1.10)/.8)**2
                    y-=.014*gauss(z-line,.019)*gauss(x-s*.94,.45)*env
        verts.append((x,y,z))
for j in range(M):
    for k in range(N):
        a=j*N+k;b=j*N+(k+1)%N;faces.append((a,a+N,b+N,b))
mesh('09_Continuous_crossed_leg_knees_carved_robe',verts,faces)

# Two feet lay across the lap, separated from the raised hands above.
for s in (-1,1):
    sweep('09_Robed_crossed_ankle_'+str(s),[(s*1.09,-.31,.735),(s*.72,-.46,.79),(s*.32,-.57,.83)],[.018,.119,.081],gold,28,18,.75)
    foot=sweep('09_Exposed_lap_foot_'+str(s),[(s*.39,-.565,.825),(s*.16,-.59,.858),(-s*.15,-.60,.852),(-s*.245,-.61,.842)],[.052,.096,.070,.012],gold,32,16,.63)
    for j in range(5):
        ellipsoid('09_Lap_toe_'+str(s)+'_'+str(j),(-s*(.145+.022*j),-.632-.020*j,.855-.010*j),(.044-.003*j,.036,.029),gold,24,12)

# Folded central apron hangs over the cross-legged seat; each fan fold shares
# the surface with the textile, with visible thickness at the hem.
av=[];af=[];U=52;V=96
for j in range(V+1):
    t=j/V;z=mix(.175,.861,t);w=mix(.43,.235,t)
    for k in range(U+1):
        u=-1+2*k/U;x=w*u
        y=-.638-.049*(1-t)-.032*cos(u*pi*3.5)*(1-.30*t)
        z1=z+.033*cos(u*pi*3.5)*(1-t)**8
        av.append((x,y,z1))
for j in range(V):
    for k in range(U):
        a=j*(U+1)+k;af.append((a,a+1,a+U+2,a+U+1))
apron=mesh('10_Seven_fan_fold_central_robe_apron',av,af)
so=apron.modifiers.new('Cloth cast edge thickness','SOLIDIFY');so.thickness=.024

# Pectoral ornament: a layered floral medallion, a finely articulated chain,
# and the diagonal strap of smaller floral bosses visible in the scene target.
def flower(name,c,r):
    ellipsoid(name+'_seed',c,(r*.25,.013,r*.25),brightgold,20,12)
    for i in range(8):
        a=2*pi*i/8
        ob=ellipsoid(name+'_petal_'+str(i),(c[0]+r*.55*sin(a),c[1],c[2]+r*.55*cos(a)),(r*.20,.009,r*.38),gold,16,10)
        ob.rotation_euler[1]=a
flower('11_Main_open_lotus_pectoral',(0,-.320,1.985),.105)
for s in (-1,1):
    pts=[]
    for j in range(25):
        t=j/24;x=s*(.02+.35*t);z=1.979+.37*t*t;y=-.315+.14*t*t
        pts.append((x,y,z))
    curve('11_Fine_pectoral_chain_'+str(s),pts,.008,brightgold)
for i in range(8):
    t=i/7;x=.34-.42*t;z=1.88-.87*t;y=-.315-.085*t
    flower('11_Sash_floral_boss_'+str(i),(x,y-.012,z),.026)

# Lotus: two staggered rows of individually thick sculpted petals. Edges and
# central veins are geometry; petal tips and rows have distinct silhouettes.
def petal(name,angle,zoffset,rscale,height,width):
    vs=[];fs=[];U=30;V=22
    for back in (0,1):
        for j in range(U+1):
            t=j/U;z=zoffset+height*t
            mid=rscale*(.91+.27*sin(pi*t)-.055*t)
            half=width*sin(pi*t)**.92+.003
            for k in range(V+1):
                u=-1+2*k/V
                bulge=.080*(1-u*u)*sin(pi*t)**.75
                lip=.015*gauss(abs(u)-.88,.09)*sin(pi*t)
                vein=.012*gauss(u,.075)*sin(pi*t)
                rad=mid+bulge+lip+vein-(.026 if back else 0)
                tang=half*u
                vs.append((rad*sin(angle)+tang*cos(angle),-rad*cos(angle)+tang*sin(angle),z+.045*u*u*sin(pi*t)))
    size=(U+1)*(V+1)
    for b in range(2):
        for j in range(U):
            for k in range(V):
                a=b*size+j*(V+1)+k;quad=(a,a+1,a+V+2,a+V+1)
                fs.append(quad if not b else tuple(reversed(quad)))
    for j in range(U):
        for k in (0,V):
            a=j*(V+1)+k;b=(j+1)*(V+1)+k;fs.append((a,b,b+size,a+size))
    for j in (0,U):
        for k in range(V):
            a=j*(V+1)+k;fs.append((a,a+size,a+size+1,a+1))
    return mesh(name,vs,fs,gold)
for row,count in enumerate((22,22)):
    for i in range(count):
        a=2*pi*(i+.5*row)/count
        if row==0:petal('12_Outer_lotus_petal_%02d'%i,a,-.670,1.32,.88,.185)
        else:petal('12_Inner_lotus_petal_%02d'%i,a,-.335,1.15,.84,.172)

def torus(name,major,minor,z,mat=gold):
    verts=[];faces=[];N=128;M=14
    for j in range(N):
        a=2*pi*j/N
        for k in range(M):
            b=2*pi*k/M;r=major+minor*cos(b)
            verts.append((r*sin(a),-r*cos(a),z+minor*sin(b)))
    for j in range(N):
        for k in range(M):
            a=j*M+k;b=((j+1)%N)*M+k;faces.append((a,b,((j+1)%N)*M+(k+1)%M,j*M+(k+1)%M))
    return mesh(name,verts,faces,mat)
torus('12_Lotus_inner_seat_lip',1.12,.067,.278)
torus('12_Lotus_root_ring',1.19,.056,-.655,darkgold)

# Reorient closed components consistently before fusing the garment. Only the
# low-frequency robe/body union uses this voxel size; the facial sculpt, hair,
# fingers, jewelry and lotus retain their authored geometry and fine relief.
for ob in list(SCULPT.objects):
    if ob.type!='MESH':continue
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bm.to_mesh(ob.data);bm.free()
garment=[ob for ob in SCULPT.objects if ob.name.startswith(('04_','06_','07_','09_'))]
bpy.ops.object.select_all(action='DESELECT')
for ob in garment:ob.select_set(True)
bpy.context.view_layer.objects.active=garment[0];bpy.ops.object.join()
garmentbody=bpy.context.object;garmentbody.name='06_Unified_body_shoulders_sleeves_crossed_legs'
rem=garmentbody.modifiers.new('Sculptural garment union','REMESH');rem.mode='VOXEL';rem.voxel_size=.0085;rem.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=rem.name)
sm=garmentbody.modifiers.new('Soft transitions at shoulders and ankles','SMOOTH');sm.factor=.35;sm.iterations=3
bpy.ops.object.modifier_apply(modifier=sm.name)

# Geometry-only exports keep the foundation separable from the native scene.
bpy.ops.object.select_all(action='DESELECT')
valid=[o for o in SCULPT.objects if o.type=='MESH']
for o in valid:o.select_set(True)
SCENE['visual_accepted']=False
SCENE['candidate']='Independent Japanese statue foundation, '+REV
SCENE['modeling_basis']='New parametric meshes and sculpted unions; official CC0 CMA multi-view photographs are reference only.'
SCENE['major_pose_change']='Both hands raised with thumb–index loops; lap forms are crossed feet.'
bpy.context.view_layer.objects.active=head
bpy.ops.export_scene.gltf(filepath=str(DEST/'japanese-buddha-foundation.glb'),use_selection=True,export_format='GLB',export_apply=True,export_yup=True)

# Neutral studio render makes surface geometry legible without room lighting.
floor=material('Studio warm charcoal','25221d',0,.82)
bpy.ops.mesh.primitive_plane_add(size=2000,location=(0,0,-.736));floorob=bpy.context.object;floorob.name='STUDIO_only_floor';floorob.data.materials.append(floor)
world=bpy.data.worlds.new('Studio dim field');world.use_nodes=True;SCENE.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.13,.13,.13,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
def area(name,loc,energy,size,color,target=(0,0,1.5)):
    light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape='DISK';light.size=size;light.color=color
    ob=bpy.data.objects.new(name,light);SCENE.collection.objects.link(ob);ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
area('STUDIO key broad neutral',(-3.4,-4.3,6.2),900,4.5,(1,.94,.83))
area('STUDIO front fill',(3.0,-4.2,3.3),330,3.3,(.86,.92,1))
area('STUDIO narrow gold rim',(2.3,2.5,4.5),900,2.6,(1,.79,.48))
camera_data=bpy.data.cameras.new('Foundation review camera');camera=bpy.data.objects.new('Foundation review camera',camera_data);SCENE.collection.objects.link(camera);SCENE.camera=camera;camera_data.lens=65
SCENE.render.engine='CYCLES';SCENE.cycles.samples=int(os.environ.get('STATUE_SAMPLES','64'));SCENE.cycles.use_denoising=True;SCENE.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
if not any(d.use for d in prefs.devices):raise RuntimeError('Metal GPU unavailable')
SCENE.render.threads_mode='FIXED';SCENE.render.threads=4
SCENE.render.resolution_x=1254;SCENE.render.resolution_y=1254;SCENE.render.resolution_percentage=100
SCENE.render.image_settings.file_format='PNG';SCENE.view_settings.view_transform='AgX';SCENE.view_settings.look='AgX - Medium High Contrast';SCENE.view_settings.exposure=.25

def view(name,loc,target,lens=65):
    camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.lens=lens
    SCENE.render.filepath=str(DEST/(name+'.png'));bpy.ops.render.render(write_still=True)
    return {'name':name,'file':name+'.png','camera':list(loc),'target':list(target),'lens':lens}
views=[]
views.append(view('gold-front',(0,-9.4,2.62),(0,-.02,1.43),65))
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/'editable-japanese-buddha.blend'),compress=True)
views.append(view('gold-three-quarter',(4.5,-8.5,2.85),(0,-.02,1.43),65))
views.append(view('face-and-hands',(0,-5.3,2.96),(0,-.18,2.51),83))
# The clay view exposes anatomical volume independently of metallic reflections.
saved=[]
for ob in valid:
    saved.append((ob,[m for m in ob.data.materials]));ob.data.materials.clear();ob.data.materials.append(clay)
views.append(view('clay-front',(0,-9.4,2.62),(0,-.02,1.43),65))
for ob,mats in saved:
    ob.data.materials.clear()
    for m in mats:ob.data.materials.append(m)
camera.location=(0,-9.4,2.62);camera.rotation_euler=(Vector((0,-.02,1.43))-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.lens=65
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/'editable-japanese-buddha.blend'),compress=True)

stats=[]
for ob in valid:
    stats.append({'name':ob.name,'vertices':len(ob.data.vertices),'triangles':sum(len(p.vertices)-2 for p in ob.data.polygons),'modifiers':[m.type for m in ob.modifiers]})
report={'revision':REV,'visualAccepted':False,'status':'unaccepted-independent-foundation-rendered',
 'geometryBasis':'New closed parametric meshes, manually authored anatomical fields and swept sculptural folds. Hand-only voxel welds.',
 'sourceModelDownloaded':False,'sourceModelDownloadStatus':'Official Sketchfab source endpoint returned HTTP 401. No authenticated/private source or viewer payload was extracted.',
 'museumReference':'Cleveland Museum of Art 1973.85.a, Japan, Heian period, gilded wood, CC0. Photographs used solely as form references.',
 'targetReference':'references/hd/4-照片-5.jpg, central statue crop. Two raised hands/loops are a new pose interpretation requiring human review.',
 'dimensions':{'kneesWidth':3.02,'faceWidthAtCheek':.696,'faceChinZ':2.50,'faceHairlineZ':3.29,'lotusRootZ':-.67,'hairApexApproxZ':3.57},
 'newComponents':['Japanese face and ear anatomy','Three incised neck rings','Continuous cowl-fold torso','Two raised loop-mudra hands','Bent robe sleeves','Crossed feet and fan-fold lap apron','Layered floral pectoral and sash bosses','44 thick individually veined lotus petals','Tangent spiral hair curls'],
 'sourceScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 'totalVertices':sum(q['vertices']for q in stats),'totalTriangles':sum(q['triangles']for q in stats),'meshObjects':len(stats),'meshes':stats,'views':views,
 'limits':['New artist-modeled study, not the Cleveland museum scan and not an exact copy of the supplied statue.','No surrounding temple, halo or chandeliers in isolated foundation export.','Facial line, knees, robe articulation and hand gesture must be visually compared at native scene scale before integration.','Material preview is Cycles; WebGL appearance requires a native render after integration.']}
(DEST/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('JAPANESE_STATUE_FOUNDATION_READY',json.dumps({k:report[k]for k in ['revision','totalVertices','totalTriangles','meshObjects','visualAccepted']}),flush=True)
