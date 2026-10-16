from pathlib import Path
p=Path('src/world.js');s=p.read_text().replace("scene.environmentIntensity=.075","scene.environmentIntensity=.125").replace("'#57472a',.16","'#57472a',.24")
s=s.replace('rand(.76,1.24)','rand(.89,1.11)').replace('pfbm(vProc*28.0)','pfbm(vProc*13.0)').replace('dFdy(bh))*.24','dFdy(bh))*.13')
s=s.replace("ly=ty+rand(-.3,.3)*height*.14", "ly=ty+rand(-.55,.65)*height*.14")
s=s.replace("i%3?'pine':'maple'", "i%3?'maple':'pine'")
s=s.replace("const roofMat=materials.slate.clone();roofMat.vertexColors", "const roofMat=materials.slate.clone();roofMat.onBeforeCompile=materials.slate.onBeforeCompile;roofMat.customProgramCacheKey=materials.slate.customProgramCacheKey;roofMat.vertexColors")
s=s.replace("const mm=materials[ma].clone();mm.side", "const mm=materials[ma].clone();mm.onBeforeCompile=materials[ma].onBeforeCompile;mm.customProgramCacheKey=materials[ma].customProgramCacheKey;mm.side")
# Add a continuous base to the distant hill silhouettes.
pos=s.index('// Layered distant hills')
s=s[:pos]+"box(0,-10,0,1400,2,1400,'earth');\n"+s[pos:]
# Dense planted islands, and grass/flowers that hold up under the overhead camera.
pos=s.index('function lilyGeo()')
island='''
for(const [ix,iz,rx,rz]of [[-8,-3,3.4,2.2],[13,3,3.4,2.4],[-18,5,2.8,3]]){
 const p=[ix,.5,iz],ids=[];for(let k=0;k<=64;k++){let a=k/64*Math.PI*2,r=1+.1*Math.sin(a*5);p.push(ix+Math.cos(a)*rx*r,-.13,iz+Math.sin(a)*rz*r);if(k<64)ids.push(0,k+1,k+2);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();instance(g,'moss',0,0,0,1,1,1);
 for(let k=0;k<35;k++){let a=k/35*Math.PI*2;rock(ix+Math.cos(a)*rx,0,iz+Math.sin(a)*rz,rand(.23,.55));}
 for(let k=0;k<100;k++){let a=rand(0,6.28),r=Math.sqrt(random())*.9,xx=ix+Math.cos(a)*rx*r,zz=iz+Math.sin(a)*rz*r,yy=.46*(1-r)+.08;instance('leaf','leafDark',xx,yy,zz,rand(.25,.45),.6,rand(.3,.7),[0,rand(0,6.28),rand(-.2,.2)]);if(k%7===0){fern(xx,yy,zz,.65);let h=rand(.24,.45);beam(v(xx,yy,zz),v(xx,yy+h,zz),.009,'leaf');for(let n=0;n<5;n++){let aa=n/5*6.28;sphere(xx+Math.cos(aa)*.055,yy+h,zz+Math.sin(aa)*.055,.045,.018,.045,'petalWhite');}sphere(xx,yy+h+.02,zz,.021,.02,.021,'pollen');}}
}
'''
s=s[:pos]+island+s[pos:]
# Round the joins of the statue arms and add shallow relief to its gilded robe.
pos=s.index('// Resting left hand')
s=s[:pos]+"for(const [xx,yy,zz,rr]of [[-.62,3.4,.08,.23],[-.95,2.65,.35,.19],[.66,3.4,.02,.23],[.92,2.75,.33,.18]])sphere(xx,yy,zz,rr,rr,rr,'buddha');\n"+s[pos:]
# One combined reflector contains the irregular shallow puddles over the foreground flagstones.
pos=s.index('// Commit geometry')
puddles='''
const puddleParts=[];
for(const [px,pz,rx,rz]of [[-7,20,2.3,1.25],[-1,22,2,1.6],[6,20.4,1.7,.9],[11,23,2.8,1.5],[-12,23,1.2,.7],[3,24,1.2,.8]]){const sh=new T.Shape();for(let i=0;i<=60;i++){let a=i/60*6.283185,r=1+.16*Math.sin(a*4+.7)+.08*Math.cos(a*7),xx=px+Math.cos(a)*rx*r,zz=pz+Math.sin(a)*rz*r;if(i===0)sh.moveTo(xx,-zz);else sh.lineTo(xx,-zz);}puddleParts.push(new T.ShapeGeometry(sh));}
const puddles=new Reflector(mergeGeometries(puddleParts),{textureWidth:1600,textureHeight:900,clipBias:.01,multisample:4,color:0x7a8073});puddles.rotation.x=-Math.PI/2;puddles.position.y=.065;puddles.material.transparent=true;puddles.material.fragmentShader=puddles.material.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4(base.rgb*.79, .57);');scene.add(puddles);
const reflectors=[water,puddles];for(const r of reflectors){const original=r.onBeforeRender;r.onBeforeRender=function(...args){const other=reflectors.filter(o=>o!==r),previous=other.map(o=>o.visible);other.forEach(o=>o.visible=false);original.apply(this,args);other.forEach((o,i)=>o.visible=previous[i]);};}
'''
s=s[:pos]+puddles+s[pos:]
s=s.replace('return {scene,water,sun,stats,','return {scene,water,puddles,sun,stats,')
p.write_text(s)
p=Path('src/main.js');s=p.read_text().replace('renderer.toneMappingExposure=.96','renderer.toneMappingExposure=1.12')
s=s.replace('world.water.visible=false;previousBefore(...args);world.water.visible=true;', 'world.water.visible=false;world.puddles.visible=false;previousBefore(...args);world.water.visible=true;world.puddles.visible=true;')
# Re-use the AO depth buffer for a deterministic, modest photographic depth of field.
a=s.index('const grade=new ShaderPass')
dof='''const dof=new ShaderPass({uniforms:{tDiffuse:{value:null},tDepth:{value:gtao.normalRenderTarget.depthTexture},focus:{value:30},aperture:{value:.0015},aspect:{value:width/height},nearClip:{value:camera.near},farClip:{value:camera.far}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D tDepth;uniform float focus,aperture,aspect,nearClip,farClip;varying vec2 vUv;
float distanceAt(vec2 uv){float z=texture2D(tDepth,uv).x;return nearClip*farClip/(farClip-z*(farClip-nearClip));}
void main(){float z=distanceAt(vUv),blur=min(.0075,aperture*abs(z-focus)/max(1.0,z));vec4 c=texture2D(tDiffuse,vUv)*4.0;float w=4.0;for(int i=0;i<24;i++){float a=float(i)*2.3999632,r=sqrt((float(i)+.5)/24.0);vec2 uv=vUv+vec2(cos(a)/aspect,sin(a))*r*blur;float zz=distanceAt(uv);float weight=zz<z*.72?.15:1.0;c+=texture2D(tDiffuse,uv)*weight;w+=weight;}gl_FragColor=c/w;}`});composer.addPass(dof);
'''
s=s[:a]+dof+s[a:]
s=s.replace('camera.fov=s.fov;camera.updateProjectionMatrix();world.update(t);', 'camera.fov=s.fov;camera.updateProjectionMatrix();dof.uniforms.focus.value=camera.position.distanceTo(target);dof.uniforms.aperture.value=(idx===5?.005:.009)*(1-targetEase)+.001;world.update(t);')
s=s.replace('shadows:\'fixed 8192 × 8192 PCF map\'',"shadows:'fixed 8192 × 8192 PCF map',reflectors:2,procedural:true")
p.write_text(s)
