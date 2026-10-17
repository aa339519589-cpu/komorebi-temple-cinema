import * as T from 'three';

// Unit thin leaves for the existing fern and narrow shore-plant instances.
// Interior samples match the preceding source exactly; only endpoint rows
// become one shared attachment and one shared tip, with no collapsed quads.
function lamina({name,rows,cols,sample}){
  const p=[0,0,0],uv=[.5,0],ids=[];
  for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,u=i/cols*2-1;p.push(...sample(u,t));uv.push(i/cols,t);}
  const tip=p.length/3;p.push(0,0,1);uv.push(.5,1);
  for(let i=0;i<cols;i++)ids.push(0,1+i,2+i);
  for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){const a=1+j*(cols+1)+i;ids.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
  const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)ids.push(last+i,tip,last+i+1);
  const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
export function createRestorationUnderstoryLeaf(seed=1){
  return lamina({name:`understory-single-ends-${seed}`,rows:18,cols:6,sample:(u,t)=>{
    const w=.27*Math.pow(Math.sin(Math.PI*t),.68)*(1+.055*Math.sin(t*12+seed));
    return[u*w,.020*Math.sin(Math.PI*t)+.010*u*u*Math.sin(Math.PI*t)+.008*u*Math.sin(t*4+seed),t];
  }});
}
export function createRestorationLanceLeaf(){
  return lamina({name:'lance-single-ends',rows:9,cols:2,sample:(u,t)=>[u*.13*Math.pow(Math.sin(Math.PI*t),.8),(.085-.030*Math.abs(u))*Math.sin(Math.PI*t),t]});
}
