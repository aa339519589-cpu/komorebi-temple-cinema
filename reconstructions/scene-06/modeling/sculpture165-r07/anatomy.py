"""Source-boundary mount and scalp helpers; +Y-up/+Z-front. No authored facial tissue or source-face projection."""
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

def ring_centre(ring):return Vector((math.fsum(p.x for p in ring)/len(ring),ring[0].y,math.fsum(p.z for p in ring)/len(ring)))

def scalp_point(u,t,ring,params,height=.230):
    centre=ring_centre(ring);p=sample_ring(ring,params,u)
    q=centre+(p-centre)*math.cos(math.pi*t*.5);q.y=centre.y+height*math.sin(math.pi*t*.5);return q

def scalp_geometry(points,height=.230):
    # Exact measured cut vertices form the first row, so the original face
    # boundary can be welded without resampling or changing source anatomy.
    ring=order_ring(points);params=ring_parameters(ring);N=len(ring);M=52;v=[];f=[]
    centre=ring_centre(ring)
    for j in range(M):
        t=j/M
        for p in ring:
            if j==0:q=p.copy()
            else:q=centre+(p-centre)*math.cos(math.pi*t*.5);q.y=centre.y+height*math.sin(math.pi*t*.5)
            v.append(tuple(q))
    for j in range(M-1):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;f.append((a,b,b+N,a+N))
    pole=len(v);v.append(tuple(centre+Vector((0,height,0))));off=(M-1)*N
    for i in range(N):f.append((off+i,off+(i+1)%N,pole))
    return v,f,ring,params
