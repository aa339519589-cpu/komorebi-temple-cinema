import {metricStoneMaps} from '../../../../reconstructions/scene-04/src/scene04-surfaces.js';
import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const maps=metricStoneMaps(741),temporary=mkdtempSync(join(tmpdir(),'scene04-textures-')),report={repeatMetres:.25,channels:{}};
for(const [name,t]of Object.entries(maps)){
 const raw=join(temporary,name+'.rgba');writeFileSync(raw,t.image.data);let lo=255,hi=0,sum=0,n=0;for(let i=0;i<t.image.data.length;i+=4){lo=Math.min(lo,t.image.data[i]);hi=Math.max(hi,t.image.data[i]);sum+=t.image.data[i];n++;}report.channels[name]={width:t.image.width,height:t.image.height,redByteRange:[lo,hi],redMean:sum/n};
 const out=new URL(name==='map'?'albedo-250mm.png':name==='normalMap'?'normal-250mm.png':'roughness-250mm.png',import.meta.url),r=spawnSync('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','512x512','-i',raw,'-frames:v','1',out.pathname],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);
}
writeFileSync(new URL('./data-ranges.json',import.meta.url),JSON.stringify(report,null,2));rmSync(temporary,{recursive:true});console.log(JSON.stringify(report));
