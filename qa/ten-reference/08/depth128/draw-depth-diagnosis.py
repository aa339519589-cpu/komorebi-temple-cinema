from pathlib import Path
import json,math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from PIL import Image
q=Path(__file__).parent;r=json.loads((q/'transform-certificate.json').read_text());s=json.loads((q/'depth-search.json').read_text())
fig,axes=plt.subplots(1,3,figsize=(18,6),layout='constrained');ax=axes[0]
colors={'west-legacy':'#2978a4','east-legacy':'#c07531','rear-legacy':'#775499'}
for e in s['protectedStaticEnvelopes']+[a['envelope'] for a in r['proposals']]:
 c=e['centre'];u,v=e['axes'];hx,hz=e['half'];pts=[[c[0]+sx*hx*u[0]+sz*hz*v[0],c[1]+sx*hx*u[1]+sz*hz*v[1]] for sx,sz in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 color=colors.get(e['name'],'#999999');ax.add_patch(Polygon(pts,facecolor=color,edgecolor=color,alpha=.27));ax.text(*c,e['name'].replace('-','\n'),ha='center',va='center',fontsize=8)
ax.plot(0,13,'^',color='black');ax.text(0,11,'fixed camera',ha='center',fontsize=8);ax.set(xlim=(-22,33),ylim=(-56,15),xlabel='World X (m)',ylabel='World Z (m)',title='All generated gallery parts lie in these envelopes');ax.set_aspect('equal');ax.grid(alpha=.15)
for n,name in enumerate(['reference-gallery-region.png','before-gallery-region.png']):
 ax=axes[n+1];im=Image.open(q/name);ax.imshow(im,extent=(480,1130,850,450));ax.set(xlim=(480,1130),ylim=(850,450),title='Supplied photo: measured tile/ridge features' if n==0 else 'Current actual127: all target rays occluded',xlabel='Original photo X (px)',ylabel='Original photo Y (px)')
 for a in r['proposals']:
  for i,p in enumerate(a.get('predictions',[])):
   x,y=p['target'];ax.plot(x,y,'o',ms=5,mfc='none',mec=colors[a['name']],mew=1.5);ax.text(x+5,y-4,('W' if a['name'].startswith('west') else 'E')+str(i+1),color=colors[a['name']],fontsize=9,weight='bold')
 ax.grid(alpha=.12)
fig.suptitle('Depth128 — CPU geometric candidate; visibility and whole-site support remain unresolved',fontsize=14)
fig.savefig(q/'depth-diagnosis.png',dpi=145)
