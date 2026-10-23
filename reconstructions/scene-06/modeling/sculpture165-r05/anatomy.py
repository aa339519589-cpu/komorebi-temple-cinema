"""Clean authored 3D anatomy; +Y-up/+Z-front. No image/source-face projection."""
import math,bisect
from mathutils import Vector

def clamp(x,a=0,b=1):return max(a,min(b,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
def gauss(x,w):return math.exp(-.5*(x/w)**2)
def mix(a,b,t):return a+(b-a)*t
def profile(keys,t):
    if t<=keys[0][0]:return keys[0][1]
    if t>=keys[-1][0]:return keys[-1][1]
    ds=[(b[1]-a[1])/(b[0]-a[0])for a,b in zip(keys,keys[1:])]
    slopes=[ds[0]]+[0 if a*b<=0 else 2*a*b/(a+b)for a,b in zip(ds,ds[1:])]+[ds[-1]]
    for i,((a,x),(b,y))in enumerate(zip(keys,keys[1:])):
        if a<=t<=b:
            u=(t-a)/(b-a);h=b-a
            return(2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*h*slopes[i]+(-2*u**3+3*u*u)*y+(u**3-u*u)*h*slopes[i+1]

def regular_surface(nu,nv,fn,cap=True):
    v=[tuple(fn(i/nu,j/nv))for j in range(nv+1)for i in range(nu)]
    f=[]
    for j in range(nv):
        for i in range(nu):
            a=j*nu+i;b=j*nu+(i+1)%nu;f.append((a,b,b+nu,a+nu))
    if cap:f.extend([tuple(range(nu-1,-1,-1)),tuple(nv*nu+i for i in range(nu))])
    return v,f

def order_ring(points):
    p=[Vector(x)for x in points];c=sum(p,Vector())/len(p)
    area=sum(a.x*b.z-b.x*a.z for a,b in zip(p,p[1:]+p[:1]))
    # From thefront, increasingu turns toward+X, matching the head meridians.
    if area>0:p.reverse()
    start=max(range(len(p)),key=lambda i:(p[i].z,-abs(p[i].x-c.x)))
    return p[start:]+p[:start]

def ring_parameters(points):
    lengths=[0.]
    for a,b in zip(points,points[1:]+points[:1]):lengths.append(lengths[-1]+(b-a).length)
    return [x/lengths[-1]for x in lengths]

def sample_ring(points,params,u):
    u=u%1;i=max(0,min(len(points)-1,bisect.bisect_right(params,u)-1))
    t=(u-params[i])/max(1e-12,params[i+1]-params[i]);return points[i].lerp(points[(i+1)%len(points)],t)

def face_relief(x,h):
    """Integrated orbital/nasal/labial tissue; h is above actual neck cut."""
    relief=.0045*gauss(x,.105)*gauss(h-.212,.048)
    for side in(-1,1):
        relief+=.011*gauss(x-side*.173,.082)*gauss(h-.477,.078)
        q=(x-side*.139)/.096
        if abs(q)<1.12:
            g=1-smooth((abs(q)-.93)/.19);inside=max(0,1-q*q)
            # Rounded upper orbital tissue and an arched closed aperture;
            # the integrated cleft is shallow, with no separate dark floor.
            line=.563+.016*math.sqrt(inside)-.003*q*side
            relief-=.0035*g*gauss(h-.608,.033)
            relief+=.0065*g*gauss(h-line-.008*inside,.0090)
            relief+=.0028*g*gauss(h-line+.006*inside,.0105)
            relief-=.0038*g*gauss(h-line,.0032)
            relief+=.0060*g*gauss(h-(.634+.014*math.sqrt(inside)),.028)
            relief+=.0045*g*gauss(h-.535,.028)
    # A smooth finite-width tissue field replaces R03b's hard q<1 footprint.
    # The nasal bridge tapers continuously through its side planes into the
    # orbital tissue; a compact rounded tip grows out of the same volume.
    peak=.052*gauss(h-.460,.090)+.030*gauss(h-.550,.110)
    width=profile([(.322,.031),(.405,.031),(.448,.026),(.530,.022),(.610,.019),(.700,.033)],h)
    relief+=peak*gauss(x,width)
    relief+=.008*gauss(x,.033)*gauss(h-.417,.020)
    for side in(-1,1):
        relief+=.013*gauss(x-side*.039,.019)*gauss(h-.394,.020)
        relief-=.0036*gauss(x-side*.035,.009)*gauss(h-.379,.007)
    relief+=.0075*gauss(x,.012)*gauss(h-.377,.015)
    relief-=.0025*gauss(x,.013)*gauss(h-.337,.019)
    relief+=.010*gauss(x,.062)*gauss(h-.324,.032)
    line=.288+.0015*(x/.08)**2;lip=gauss(x,.063)
    relief+=.0055*lip*gauss(h-line-.008-.0015*gauss(x,.019),.010)
    relief+=.0070*lip*gauss(h-line+.010,.012)
    relief-=.0038*lip*gauss(h-line,.0038)
    relief-=.0025*gauss(x,.078)*gauss(h-.246,.020)
    for side in(-1,1):relief-=.0016*gauss(x-side*.068,.012)*gauss(h-line,.010)
    relief+=.006*gauss(x,.013)*gauss(h-.708,.014)
    return relief

HEAD_ROWS=[
    (0,.205,.195,.000),(.080,.197,.190,.000),(.150,.192,.198,.006),
    (.200,.211,.220,.014),(.300,.255,.241,.003),(.450,.296,.258,-.009),
    (.590,.302,.255,-.020),(.720,.296,.250,-.025),(.790,.280,.235,-.030),
    (.880,.233,.200,-.040),(.970,.130,.120,-.040),(1.010,0,0,-.040)
]

def natural_spline(keys):
    """C2 meridian curvature avoids specular bands at jaw/neck key rows."""
    xs=[a for a,b in keys];ys=[b for a,b in keys];n=len(keys);h=[xs[i+1]-xs[i]for i in range(n-1)]
    alpha=[0.]+[3*((ys[i+1]-ys[i])/h[i]-(ys[i]-ys[i-1])/h[i-1])for i in range(1,n-1)]+[0.]
    l=[1.]*n;mu=[0.]*n;z=[0.]*n;c=[0.]*n;b=[0.]*(n-1);d=[0.]*(n-1)
    for i in range(1,n-1):l[i]=2*(xs[i+1]-xs[i-1])-h[i-1]*mu[i-1];mu[i]=h[i]/l[i];z[i]=(alpha[i]-h[i-1]*z[i-1])/l[i]
    for i in range(n-2,-1,-1):c[i]=z[i]-mu[i]*c[i+1];b[i]=(ys[i+1]-ys[i])/h[i]-h[i]*(c[i+1]+2*c[i])/3;d[i]=(c[i+1]-c[i])/(3*h[i])
    return xs,ys,b,c,d

HEAD_SPLINES=[natural_spline([(r[0],r[k])for r in HEAD_ROWS])for k in(1,2,3)]
def head_profile(k,t):
    xs,ys,b,c,d=HEAD_SPLINES[k]
    if t<=xs[0]:return ys[0]
    if t>=xs[-1]:return ys[-1]
    i=bisect.bisect_right(xs,t)-1;q=t-xs[i];return ys[i]+b[i]*q+c[i]*q*q+d[i]*q*q*q

def head_point(u,h,axis,neck_ring,neck_params):
    a=2*math.pi*u;sa=math.sin(a);ca=math.cos(a)
    rx=max(0,head_profile(0,h));rz=max(0,head_profile(1,h));cz=head_profile(2,h)
    x=rx*sa;front=max(0,ca)
    z=cz+rz*math.copysign(abs(ca)**(.90 if ca>0 else 1),ca)
    z+=face_relief(x,h)*front**3
    p=Vector((axis.x+x,axis.y+h,axis.z+z))
    if h<.145:
        q=sample_ring(neck_ring,neck_params,u);q.y=axis.y+h
        p=q.lerp(p,smooth(h/.145))
        if ca>0:
            p.z-=front**3*sum(.0018*gauss(h-y,.0075)for y in(.045,.080,.115))
    return p

def head_geometry(axis,neck_ring):
    ring=order_ring(neck_ring);params=ring_parameters(ring)
    return (*regular_surface(384,420,lambda u,v:head_point(u,-.035+1.045*v,axis,ring,params)),ring,params)

def ear_geometry(side,axis):
    # Authored closed pinna with lobule, concha, helical rim and antihelix.
    rows=[(.195,0,0),(.225,.026,.023),(.300,.036,.034),(.420,.057,.045),(.555,.073,.050),(.660,.064,.044),(.720,.036,.030),(.745,0,0)]
    def fn(u,v):
        h=mix(.195,.745,v);a=2*math.pi*u;wx=profile([(q[0],q[1])for q in rows],h);dz=profile([(q[0],q[2])for q in rows],h)
        cx=.310+.010*gauss(h-.39,.11);local=wx*math.sin(a);front=max(0,math.cos(a))
        z=.024+.015*gauss(h-.275,.065)-.012*gauss(h-.65,.07)+dz*math.cos(a)
        z+=front**2*(-.032*gauss(local+.004,.034)*gauss(h-.535,.105)+.010*gauss(abs(local)-wx*.78,.009)*gauss(h-.55,.12))
        anti=-.004+.014*math.sin((h-.30)/.40*math.pi)
        z+=front**2*.008*gauss(local-anti,.009)*gauss(h-.530,.105)
        z+=front**2*(.015*gauss(local+wx*.50,.012)*gauss(h-.495,.035)+.009*gauss(local+.015,.013)*gauss(h-.390,.030)-.006*gauss(local-.010,.019)*gauss(h-.640,.030))
        return(axis.x+side*(cx+local),axis.y+h,axis.z+z)
    verts,faces=regular_surface(100,150,fn)
    if side<0:faces=[tuple(reversed(f))for f in faces]
    return verts,faces

def cowl_geometry(points,side):
    # Exact source cut perimeter followed by deep authored outward cloth.
    base=[Vector(x)for x in points];c=sum(base,Vector())/len(base)
    normal=sum(((a-c).cross(b-c)for a,b in zip(base,base[1:]+base[:1])),Vector())
    if normal.dot(Vector((side,0,0)))>0:base.reverse()
    relaxed=[p.copy()for p in base]
    for _ in range(12):relaxed=[p*.5+(relaxed[(i-1)%len(base)]+relaxed[(i+1)%len(base)])*.25 for i,p in enumerate(relaxed)]
    v=[];f=[];N=len(base);M=112
    for j in range(M+1):
        t=j/M;scale=profile([(0,1),(.18,1.04),(.50,.84),(.80,.50),(1,0)],t)
        outward=.39*math.sin(math.pi*t*.5);forward=.055*math.sin(math.pi*t)
        for i,p0 in enumerate(base):
            # Only newly authored cowl rows relax away from the unchanged
            # source cut. This removes inherited jagged edge extrusion;
            # original measured torso geometry is never smoothed here.
            p=p0.lerp(relaxed[i],smooth(t/.20))
            q=c+(p-c)*scale+Vector((side*outward,-.035*t,forward))
            # Three unequal broad gathers are on the actual3D cowl, fading
            # to zero on the untouched donor shoulder boundary.
            u=i/N;load=0
            for k,(at,amp,w)in enumerate([(.22,.025,.070),(.48,.036,.090),(.72,.019,.065)]):
                d=u-(at+.07*math.sin(2*t+k*.8));load+=amp*math.tanh(d/w)*gauss(d,w*1.8)
            q.z+=load*math.sin(math.pi*t)**1.4
            v.append(tuple(q))
    for j in range(M):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;f.append((a,b,b+N,a+N))
    f.append(tuple(M*N+i for i in range(N)));return v,f

def underside_return_geometry(points):
    """Actual thick local return below the donor's flat seat cut.

    The source perimeter remains exactly intact. A rounded inward/downward
    cloth underside ends in a compact bearing disk inside the closed lotus
    core. It replaces the exposed whole-span planar triangulated cap.
    """
    ring=order_ring(points);params=ring_parameters(ring);N=len(ring);M=40;v=[];f=[]
    for j in range(M+1):
        t=j/M;blend=smooth(t);drop=-.220*math.sin(math.pi*t*.5)
        for i,p in enumerate(ring):
            a=2*math.pi*params[i];target=Vector((.620*math.sin(a),0,.520*math.cos(a)))
            q=p.lerp(target,blend);q.y=drop;v.append(tuple(q))
    for j in range(M):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;f.append((a,a+N,b+N,b))
    centre=len(v);v.append((0,-.220,0));off=M*N
    for i in range(N):f.append((centre,off+(i+1)%N,off+i))
    return v,f
