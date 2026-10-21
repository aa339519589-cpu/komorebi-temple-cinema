from pathlib import Path
p=Path('lookdev/scene07-stone-toro156/build-toro156.py');s=p.read_text().replace("os.environ.get('TORO_REVISION','r04')","os.environ.get('TORO_REVISION','r05')")
s=s.replace("    dense=[profile[0]]", "    edge_z=[z for r,z in profile if r>1e-7];rng=random.Random(seed*171+56);chips=[(rng.random()*TAU,rng.choice(edge_z),.035+rng.random()*.06,.007+rng.random()*.014) for _ in range(16)]\n    dense=[profile[0]]")
s=s.replace("a=i*TAU/N;rr=plan_radius(a,r,kind);rr+=sculpt_noise((rr*math.cos(a),rr*math.sin(a),z),seed)", "a=i*TAU/N;rr=plan_radius(a,r,kind);rr+=sculpt_noise((rr*math.cos(a),rr*math.sin(a),z),seed)\n            for ca,cz,cw,cd in chips:\n                da=(a-ca+math.pi)%TAU-math.pi;rr-=cd*math.exp(-(da/cw)**2-((z-cz)/.025)**2)")
needle="course('Fire chamber bottom moulding'"
pos=s.index(needle)
s=s[:pos]+'''# Actual attached bas-relief below the fire chamber, set into each solid
# stone facet. It is geometry, not a pasted ornament texture or floating sheet.
for j in range(6):
    a=math.pi/6+j*TAU/6;N=Vector((math.cos(a),math.sin(a),0));X=Vector((-math.sin(a),math.cos(a),0));origin=N*(.73*math.cos(math.pi/6)-.004)+Vector((0,0,2.25))
    for offset in [-.18,.18]:
        for k in range(7):leaf('Carved platform floral frieze',origin+X*offset,X,N,.060,.047,k*TAU/7,.010,139+j+k)
    points=[origin+X*(-.31+k*.62/32)+Vector((0,0,.027*math.sin(k*TAU/16))) for k in range(33)];tube('Carved platform connected vine',points,.004)
''' +s[pos:]
s=s.replace("A=360;R=64", "A=480;R=64").replace(".004+random.random()*.013", ".006+random.random()*.018")
s=s.replace("groove=.007*max(0,math.sin(30*a+.7*math.sin(t*9)))**8*math.sin(math.pi*t)**2;h-=groove", "groove=.007*max(0,math.sin(30*a+.7*math.sin(t*9)))**8*math.sin(math.pi*t)**2;h-=groove\n    for crack in [.38,2.83,4.65]:\n        da=(a-crack-.055*math.sin(t*7)+math.pi)%TAU-math.pi;h-=.010*math.exp(-(da/.016)**2)*max(0,min(1,(t-.27)/.25))")
a=s.index("        p=o.matrix_world@v.co;coarse=")
b=s.index('\n# Real studio illumination',a)
s=s[:a]+'''        p=o.matrix_world@v.co;coarse=noise.noise(p*12+Vector((17.2,3.7,8.9)));fine=noise.noise(p*47+Vector((4,8,2)));field=coarse+.38*fine
        lichen=max(0,min(1,(field+.025)/.20));lichen=lichen*lichen*(3-2*lichen);mineral=max(0,min(1,(fine-.08)/.28));mineral=mineral*mineral*(3-2*mineral);tone=.90-.39*lichen+.20*mineral+.045*noise.noise(p*81)
        if o['toroRole']=='cap':tone*=.84
        attr.data[i].color=(tone*(1-lichen*.17),tone*(1-lichen*.045),tone*(.94-lichen*.18),1)
''' +s[b:]
s=s.replace("bs.inputs['Roughness'].default_value=.9;m['toroRole']", "rough=n.new('ShaderNodeMapRange');rough.inputs['From Min'].default_value=0;rough.inputs['From Max'].default_value=1;rough.inputs['To Min'].default_value=.78;rough.inputs['To Max'].default_value=.95;l.new(tn['rough'].outputs['Color'],rough.inputs['Value']);l.new(rough.outputs['Result'],bs.inputs['Roughness']);m['toroRole']")
p.write_text(s)
