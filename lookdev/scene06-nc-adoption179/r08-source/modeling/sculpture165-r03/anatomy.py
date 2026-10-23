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
    relief=.006*gauss(x,.13)*gauss(h-.215,.055)
    for side in(-1,1):
        relief+=.013*gauss(x-side*.185,.085)*gauss(h-.475,.075)
        q=(x-side*.143)/.098
        if abs(q)<1.12:
            g=1-smooth((abs(q)-.93)/.19);inside=max(0,1-q*q)
            line=.575+.006*inside+.002*q*side
            relief+=.004*g*gauss(h-.614,.042)
            relief+=.0085*g*gauss(h-line-.006*inside,.0065)
            relief+=.0024*g*gauss(h-line+.006*inside,.0085)
            relief-=.0090*g*gauss(h-line,.0038)
            relief+=.0045*g*gauss(h-(.638+.012*math.sqrt(inside)),.020)
    # Long straight, sloping nasal planes. The tip does not terminate as a
    # round isolated button: the broad bridge continues into the glabella.
    peak=profile([(.315,0),(.365,.026),(.405,.112),(.455,.125),(.530,.098),(.610,.055),(.690,0)],h)
    width=profile([(.315,.043),(.405,.043),(.470,.034),(.610,.030),(.690,.043)],h)
    q=abs(x)/width
    if q<1:relief+=peak*(1-q*q)**.70
    for side in(-1,1):
        relief+=.019*gauss(x-side*.045,.021)*gauss(h-.399,.023)
        relief-=.011*gauss(x-side*.041,.009)*gauss(h-.381,.008)
    relief+=.012*gauss(x,.013)*gauss(h-.378,.018)
    relief-=.0035*gauss(x,.012)*gauss(h-.337,.019)
    line=.285+.005*(x/.09)**2;lip=gauss(x,.076)
    relief+=.0075*lip*gauss(h-line-.007-.002*gauss(x,.018),.008)
    relief+=.0090*lip*gauss(h-line+.010,.010)
    relief-=.0075*lip*gauss(h-line,.0036)
    relief-=.0035*gauss(x,.09)*gauss(h-.245,.015)
    for side in(-1,1):relief-=.003*gauss(x-side*.080,.012)*gauss(h-line,.009)
    relief+=.008*gauss(x,.013)*gauss(h-.708,.014)
    return relief

HEAD_ROWS=[
    (0,.205,.195,.000),(.080,.197,.190,.000),(.150,.195,.200,.005),
    (.200,.218,.225,.010),(.300,.269,.243,.000),(.450,.308,.262,-.012),
    (.590,.312,.256,-.023),(.720,.304,.250,-.027),(.790,.282,.235,-.030),
    (.880,.233,.200,-.040),(.970,.130,.120,-.040),(1.010,0,0,-.040)
]

def head_point(u,h,axis,neck_ring,neck_params):
    a=2*math.pi*u;sa=math.sin(a);ca=math.cos(a)
    rx=profile([(q[0],q[1])for q in HEAD_ROWS],h);rz=profile([(q[0],q[2])for q in HEAD_ROWS],h);cz=profile([(q[0],q[3])for q in HEAD_ROWS],h)
    x=rx*sa;front=max(0,ca)
    z=cz+rz*math.copysign(abs(ca)**(.79 if ca>0 else 1),ca)
    z+=face_relief(x,h)*front**3
    p=Vector((axis.x+x,axis.y+h,axis.z+z))
    if h<.145:
        q=sample_ring(neck_ring,neck_params,u);q.y=axis.y+h
        p=q.lerp(p,smooth(h/.145))
        if ca>0:
            p.z-=front**3*sum(.0032*gauss(h-y,.006)for y in(.045,.080,.115))
    return p

def head_geometry(axis,neck_ring):
    ring=order_ring(neck_ring);params=ring_parameters(ring)
    return (*regular_surface(384,420,lambda u,v:head_point(u,-.035+1.045*v,axis,ring,params)),ring,params)

def ear_geometry(side,axis):
    # Authored closed pinna with lobule, concha, helical rim and antihelix.
    rows=[(.145,0,0),(.185,.030,.025),(.285,.043,.038),(.475,.050,.045),(.625,.045,.038),(.730,.028,.025),(.760,0,0)]
    def fn(u,v):
        h=mix(.145,.760,v);a=2*math.pi*u;wx=profile([(q[0],q[1])for q in rows],h);dz=profile([(q[0],q[2])for q in rows],h)
        cx=.337+.010*gauss(h-.53,.12);local=wx*math.sin(a);front=max(0,math.cos(a))
        z=.015+dz*math.cos(a)
        z+=front**2*(-.027*gauss(local+.003,.024)*gauss(h-.505,.125)+.009*gauss(abs(local)-wx*.78,.008)*gauss(h-.53,.15))
        anti=-.004+.014*math.sin((h-.30)/.40*math.pi)
        z+=front**2*.006*gauss(local-anti,.007)*gauss(h-.505,.13)
        return(axis.x+side*(cx+local),axis.y+h,axis.z+z)
    verts,faces=regular_surface(100,150,fn)
    if side<0:faces=[tuple(reversed(f))for f in faces]
    return verts,faces

def cowl_geometry(points,side):
    # Exact source cut perimeter followed by deep authored outward cloth.
    base=[Vector(x)for x in points];c=sum(base,Vector())/len(base)
    normal=sum(((a-c).cross(b-c)for a,b in zip(base,base[1:]+base[:1])),Vector())
    if normal.dot(Vector((side,0,0)))>0:base.reverse()
    v=[];f=[];N=len(base);M=36
    for j in range(M+1):
        t=j/M;scale=profile([(0,1),(.18,1.04),(.50,.84),(.80,.50),(1,0)],t)
        outward=.39*math.sin(math.pi*t*.5);forward=.055*math.sin(math.pi*t)
        for i,p in enumerate(base):
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
