"""Measured construction diagrams from actual CPU build data, not render pixels."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
import math

HERE = Path(__file__).resolve().parent
audit = json.loads((HERE / 'physical-audit.json').read_text())
data = audit['foundation']
fig, (ax, plan) = plt.subplots(1, 2, figsize=(13.5, 7), gridspec_kw={'width_ratios': [1.1, 1]})
stone, edge = '#a6a08d', '#59584f'
for index, item in enumerate(data['bridge']['piers']):
    f, p = item['foot'], item['pier']
    v = (-.55, .55)[index]
    # U=0 transverse footing slice: exact sampled bottom fan/edge ordinates.
    lower_left = (f['samples'][0]['footY'] + f['samples'][1]['footY']) / 2
    lower_right = (f['samples'][4]['footY'] + f['samples'][5]['footY']) / 2
    poly = [(v-.25, lower_left), (v, f['centreFootY']), (v+.25, lower_right),
            (v+.23, f['shoulderY']), (v-.23, f['shoulderY'])]
    ax.add_patch(Polygon(poly, closed=True, facecolor=stone, edgecolor=edge))
    ax.add_patch(Rectangle((v-.23, f['shoulderY']), .46, f['bearingTopY']-f['shoulderY'], facecolor=stone, edgecolor=edge))
    n = p['courses']
    for j in range(n):
        t0, t1 = j/n, (j+1)/n
        y0 = p['bottomY']+(p['topY']-p['bottomY'])*t0
        y1 = p['bottomY']+(p['topY']-p['bottomY'])*t1
        d0, d1 = .46+(.38-.46)*t0, .46+(.38-.46)*t1
        ax.add_patch(Polygon([(v-d0/2,y0),(v+d0/2,y0),(v+d1/2,y1),(v-d1/2,y1)], facecolor=stone, edgecolor=edge, linewidth=.65))
    ax.plot([v-.25,v,v+.25], [lower_left+.08,f['centreGroundY'],lower_right+.08], color='#596b3e', linewidth=2)
    ax.annotate('8 cm minimum embed', (v, f['centreFootY']), (v-.35, -.68), fontsize=8, arrowprops={'arrowstyle': '->', 'color': edge})
ax.add_patch(Rectangle((-.85,2.56),1.7,.24,facecolor='#b0aa97',edgecolor=edge,linewidth=1.4))
ax.add_patch(Rectangle((-.75,2.795264),1.5,.19,facecolor='#845137',edgecolor='#5a321d'))
for v in [-.55,.55]:
    ax.annotate('', (v,2.98),(v,3.18),arrowprops={'arrowstyle':'->','color':'#784c2f','lw':1.4})
ax.axhline(1, color='#2f7591', linestyle='--', linewidth=1.4, label='Actual water Y1.00')
ax.annotate('',(-.30,1.25),(.30,1.25),arrowprops={'arrowstyle':'<->','color':'#2f7591'})
ax.text(0,1.36,'≥ 0.60 m clear physical bay',ha='center',fontsize=9,color='#245c70')
ax.text(0,2.43,'Cap underside Y2.56',ha='center',fontsize=9)
ax.text(0,3.24,'Bridge + stair load → cap → two piers → real bed',ha='center',fontsize=9)
ax.set(xlim=(-1.08,1.08),ylim=(-.8,3.4),xlabel='Bridge transverse coordinate (m)',ylabel='World height Y (m)',title='Low landing: transverse physical section')
ax.grid(alpha=.18);ax.legend(loc='lower right',fontsize=8)

def rotated_rect(origin, yaw, w, d):
    c,s=math.cos(yaw),math.sin(yaw)
    return [(origin[0]+c*x+s*z,origin[1]-s*x+c*z) for x,z in [(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]]
plan.add_patch(Rectangle((-.8,-6.3),3.2,15,facecolor='#c6e2eb',edgecolor='#2f7591',alpha=.75))
plan.add_patch(Polygon(rotated_rect((-1.86,-7.5),-.55,4.7,8.8),closed=True,fill=False,edgecolor='#a64f41',linestyle='--',linewidth=1.7,label='Removed full wing base'))
for f in data['wing']['footings']:
    plan.add_patch(Polygon(rotated_rect((f['origin'][0],f['origin'][2]),f['yaw'],*f['foot']),facecolor=stone,edgecolor=edge))
    plan.plot(f['origin'][0],f['origin'][2],marker='+',color='#33352b')
for item in data['bridge']['piers']:
    f=item['foot'];plan.add_patch(Polygon(rotated_rect((f['origin'][0],f['origin'][2]),f['yaw'],*f['foot']),facecolor=stone,edgecolor=edge))
plan.text(.8,3.8,'Water corridor',ha='center',color='#245c70',fontsize=9)
plan.text(-5.8,-1.0,'Six individual wing feet\nCaps retain Y1.50 seats',fontsize=9)
plan.annotate('Two low-landing feet',(1.9,-3.7),(-4.8,2),fontsize=9,arrowprops={'arrowstyle':'->'})
plan.set(xlim=(-6.8,3.3),ylim=(-13,5),xlabel='World X (m)',ylabel='World Z (m)',title='Plan: broad wing base replaced by sampled feet')
plan.set_aspect('equal');plan.grid(alpha=.18);plan.legend(loc='lower left',fontsize=8)
fig.suptitle('Foundation126 — actual bearing/ground datums; face weathering omitted in diagram',fontsize=12)
fig.tight_layout()
fig.savefig(HERE/'physical-sections.png',dpi=170)
fig.savefig(HERE/'physical-sections.svg')
