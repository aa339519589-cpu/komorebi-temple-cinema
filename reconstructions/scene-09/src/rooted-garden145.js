import {loadLicensedCrown145} from './licensed-crown145.js';

const rng=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
const seedAt=(x,z,s)=>((Math.round(x*337)^Math.round(z*751)^s)>>>0);

// Complete connected CC0 curved leaves preserve their source normals and UVs.
// These are real botanical surfaces on modeled branches, never scene cards.
export async function createRootedGarden145({emit,between,materials,ownedMaterials,ownedTextures}){
 const plant=await loadLicensedCrown145(),leaves=plant.leaves;
 for(const v of plant.variants)for(const p of v.parts){
  if(!ownedMaterials.includes(p.material))ownedMaterials.push(p.material);
  p.material.color.setHex(0x91a47c);p.material.emissiveIntensity=.008;p.material.normalScale.set(.38,.38);p.material.roughness=.84;
  for(const key of['map','normalMap','roughnessMap'])if(p.material[key]&&!ownedTextures.includes(p.material[key]))ownedTextures.push(p.material[key]);
 }
 const bark=materials.bark;
 function leaf(p,size,a,tilt,index,tint){const l=leaves[index%leaves.length];emit(l.geometry,l.material,...p,size,size,size,[tilt,a,.24*Math.sin(a*3.7)],tint);}
 function groundPlant(x,y,z,scale,angle,index){for(const p of plant.variants[index%plant.variants.length].parts)emit(p.geometry,p.material,x,y,z,scale,scale,scale,[0,angle,0],.82);}
 function shrub(x,y,z,r=1,height=1,seed=145){
  const random=rng(seedAt(x,z,seed)),phase=random()*6.28,count=Math.max(15,Math.round(16+r*7));
  for(let j=0;j<count;j++){
   const a=phase+j*2.39996,rr=r*Math.sqrt(.15+.80*random()),end=[x+Math.cos(a)*rr,y+r*(.18+.38*Math.sqrt(Math.max(0,1-(rr/r)**2)))*height,z+Math.sin(a)*rr*.89],base=[x,y-.16,z];
   between(base,end,.015,.015,bark,true,.75);
   for(let b=0;b<3;b++){
    const az=a+(b-1)*.79,reach=r*(.12+.15*random()),tip=[end[0]+Math.cos(az)*reach,end[1]+r*(.04+random()*.11)*height,end[2]+Math.sin(az)*reach],start=[base[0]+(end[0]-base[0])*.70,base[1]+(end[1]-base[1])*.70,base[2]+(end[2]-base[2])*.70];
    between(start,tip,.006,.006,bark,true,.72);
    for(let k=0;k<9;k++){
     const t=.12+.86*random(),p=start.map((v,i)=>v+(tip[i]-v)*t);
     for(const sign of[-1,1])leaf(p,.074+random()*.071,az+sign*(.45+random()*.9),-.38+random()*1.35,j+b+k,.68+random()*.42);
    }
   }
  }
  for(let j=0;j<3;j++){const a=phase+j*2.399;groundPlant(x+Math.cos(a)*r*.51,y-.14,z+Math.sin(a)*r*.51,.22+.14*random(),a,j+Math.floor(random()*4));}
 }
 function tree(x,z,h,r=1,pink=false,seed=145,blossom=null,pinkMaterial=null){
  const random=rng(seedAt(x,z,seed)),root=[x,0,z],lean=[x+.28,h*.87,z-.12];
  between(root,lean,.17+h*.010,.17+h*.010,bark,true,.81);
  for(let j=0;j<13;j++){
   const a=j*2.399+random()*.4,yy=h*(.31+j*.044),reach=r*(.70+.23*random())*(1-j*.026),base=[x+.28*yy/h,yy,z-.12*yy/h],tip=[base[0]+Math.cos(a)*reach,yy+h*.052,base[2]+Math.sin(a)*reach];
   between(base,tip,.064,.064,bark,true,.77);
   for(let b=0;b<9;b++){
    const az=a+(b-4)*.28,rr=r*(.23+.36*random()),end=[tip[0]+Math.cos(az)*rr,tip[1]+r*(random()-.30)*.49,tip[2]+Math.sin(az)*rr];
    between(tip,end,.016,.016,bark,true,.78);
    for(let k=0;k<45;k++){
     const t=.16+.82*random(),anchor=tip.map((v,i)=>v+(end[i]-v)*t),p=[...anchor],jitter=r*.34;p[0]+=(random()-.5)*jitter;p[1]+=(random()-.5)*jitter;p[2]+=(random()-.5)*jitter;between(anchor,p,.0035,.0035,bark,true,.74);
     if(pink&&blossom&&pinkMaterial)emit(blossom,pinkMaterial,...p,.62,.62,.62,[random(),az,random()],.78+random()*.36);
     else leaf(p,.28+random()*.27,az+random()*2.8-.8,random()*1.8-.7,j+b+k,.64+random()*.46);
    }
   }
  }
 }
 return{shrub,tree,revision:'scene09-rooted-CC0-folded-leaf-volume145-r05',provenance:plant.info};
}
