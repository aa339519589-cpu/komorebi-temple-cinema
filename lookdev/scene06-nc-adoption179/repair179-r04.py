from pathlib import Path
import shutil,json
root=Path('.');scene=root/'reconstructions/scene-06';look=root/'lookdev/scene06-nc-adoption179'
p=look/'lotus-throne179-r04.js';p.write_text(p.read_text().replace('sourceBearing?.outline?.length?.90:null','sourceBearing?.outline?.length ? .90 : null'))
shutil.copy2(p,scene/'src/lotus-throne179.js')
p=scene/'src/restoration-altar.js';s=p.read_text().replace('if(radius>1){buildLayeredSourceLotus179','if(radius>0){buildLayeredSourceLotus179')
s=s.replace("color:'#cba04c',metalness:.88,roughness:.49","color:'#c39646',metalness:.86,roughness:.40").replace("color:'#bd8e3e',metalness:.86,roughness:.52","color:'#a97c35',metalness:.84,roughness:.46").replace("color:'#865d25',metalness:.82,roughness:.52","color:'#664219',metalness:.78,roughness:.52")
p.write_text(s)
p=scene/'src/reference6-scene.js';s=p.read_text().replace('scene06-nc-adoption179-r03-personal','scene06-nc-adoption179-r04-personal')
s=s.replace("beam:new T.MeshStandardMaterial({name:'reference6-red-brown-ceiling-timber',color:timberMap?'#995f3e':'#71341f',map:wood,bumpMap:wood,bumpScale:.0015,roughness:.39}),","beam:new T.MeshPhysicalMaterial({name:'scene06-r04-deep-red-lacquer-structural-timber',color:'#722b17',map:wood,bumpMap:wood,bumpScale:.0013,roughness:.56,specularIntensity:.28,clearcoat:.12,clearcoatRoughness:.44}),\n  rearFrame:new T.MeshPhysicalMaterial({name:'scene06-r04-shadowed-rear-lacquer-framing',color:'#451c12',map:wood,roughness:.65,specularIntensity:.22,clearcoat:.08,clearcoatRoughness:.52}),")
s=s.replace("gold:new T.MeshStandardMaterial({name:'reference6-cast-gilt',color:'#d7aa51',metalness:.88,roughness:.27})","gold:new T.MeshStandardMaterial({name:'scene06-r04-aged-gilt-furnishing-and-architectural-mounts',color:'#b88939',metalness:.86,roughness:.37})")
s=s.replace("oldgold:new T.MeshStandardMaterial({name:'reference6-carved-gilt-recess',color:'#ad7829',metalness:.84,roughness:.34})","oldgold:new T.MeshStandardMaterial({name:'scene06-r04-deep-carved-aged-gilt-recess',color:'#805421',metalness:.82,roughness:.45})")
s=s.replace("color:woodTint??'#683722'","color:'#62301b'")
s=s.replace("[.11,5.68,.22],materials.beam)","[.11,5.68,.22],materials.rearFrame)").replace("[1.67,.12,.22],materials.beam)","[1.67,.12,.22],materials.rearFrame)").replace("[13.6,.28,.36],materials.beam)","[13.6,.28,.36],materials.rearFrame)")
s=s.replace('throneRadii:[1.24,.76]','throneRadii:[1.18,.76]')
s=s.replace("const m=material.clone();m.name=cacheKey+'-ordinary-PBR';","const m=material.clone();m.name=cacheKey+'-ordinary-PBR';")
p.write_text(s)
p=scene/'src/sculptural-cast-assets.js';p.write_text(p.read_text().replace('scene06-nc-adoption179-r03-CC','scene06-nc-adoption179-r04-CC'))
