from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
p=Path(__file__).parent
r=json.loads((p/'physical-audit.json').read_text())
fig,axs=plt.subplots(2,2,figsize=(13,9),layout='constrained')
for ax,z in zip(axs.flat,[-3.7,-5.8,-9,-18]):
 row=next(x for x in r['gradeProfiles'] if x['z']==z)
 x=np.array([q['x'] for q in row['profile']]);new=np.array([q['y'] for q in row['profile']]);old=np.array([q['oldY'] for q in row['profile']])
 ax.fill_between(x,-1.6,new,color='#82796b',alpha=.62,label='closed soil/rock volume')
 ax.plot(x,new,color='#4f662f',lw=2,label='actual new surface mesh')
 ax.plot(x,old,'--',color='#545454',label='old grade')
 c=row['rill']
 if z>=-10: ax.plot([c['centre']-c['halfWidth'],c['centre']+c['halfWidth']],[row['waterY']]*2,color='#3976a7',lw=3,label='physical flowing-water shelf')
 for foot in r['foundation']['supportSamples']:
  if abs(foot['origin'][2]-z)<.8:
   xx=foot['origin'][0];ax.plot([xx,xx],[foot['centreFootY'],foot['bearingTopY']],color='#a55633',lw=6)
 ax.set(title=f'World section at Z {z} m',xlabel='World X (m)',ylabel='World Y (m)',ylim=(-1.8,5.2),xlim=(-9,11));ax.grid(alpha=.15)
axs[0,0].legend(loc='upper left',fontsize=8)
fig.suptitle('Scene08 terrain127 — inferred physical grade, not photographic acceptance',fontsize=14)
fig.savefig(p/'grade-sections.png',dpi=155);fig.savefig(p/'grade-sections.svg')

svg=p/'grade-sections.svg'
svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
