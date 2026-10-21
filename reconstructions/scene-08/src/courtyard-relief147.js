import * as T from 'three';

// Independent cast relief for the inter-column lintels: closed scrolling stems,
// folded leaves and seeded asymmetry, mounted over a recessed dark timber bed.
export function createCourtyardRelief(){
 const resources=new Set(),variants=[];
 const keep=g=>{resources.add(g);return g;};
 for(let variant=0;variant<4;variant++){
  const parts=[],add=(g,material)=>parts.push({geometry:keep(g),material});
  const back=new T.BoxGeometry(.78,.205,.045);back.translate(0,0,-.025);add(back,'wood');
  for(const sign of[-1,1]){
   const path=[];
   for(let i=0;i<=24;i++){const t=i/24,angle=(.25+t*1.55)*Math.PI,r=.115*(1-t*.70);path.push(new T.Vector3(sign*(.055+t*.23+Math.cos(angle)*r),Math.sin(angle)*r*(.66+.04*variant),.006));}
   add(new T.TubeGeometry(new T.CatmullRomCurve3(path),40,.008,6,false),'joinerygilt');
   for(let k=0;k<4;k++){
    const x=sign*(.09+k*.065),y=.030*Math.sin(k*1.7+variant*.4),s=new T.Shape();s.moveTo(-.045,0);s.bezierCurveTo(-.035,.035,.015,.052,.050,.012);s.bezierCurveTo(.035,-.018,-.012,-.027,-.045,0);
    const g=new T.ExtrudeGeometry(s,{depth:.012,steps:1,curveSegments:8,bevelEnabled:true,bevelThickness:.004,bevelSize:.003,bevelSegments:2});
    g.rotateZ(sign*(.45+k*.33));g.translate(x,y,.008);add(g,'joinerygilt');
   }
  }
  const flower=new T.SphereGeometry(.026,10,6);flower.scale(.85,1,.26);flower.translate(0,0,.024);add(flower,'gold');
  for(const yy of[-.103,.103]){const edge=new T.BoxGeometry(.81,.014,.028);edge.translate(0,yy,.008);add(edge,'oldgold');}
  variants.push(parts);
 }
 return {variants,resources};
}
