import {materials} from '../../../reconstructions/scene-02/kernel.js';
import {buildArchitecture} from '../../../reconstructions/scene-02/architecture.js';
import {buildGarden} from '../../../reconstructions/scene-02/garden.js';
const {mats}=materials();const a=buildArchitecture(mats),g=buildGarden(mats);let vertices=0,triangles=0,invalid=0;for(let group of[a.group,g.group])group.traverse(o=>{if(o.isMesh){let n=o.isInstancedMesh?o.count:1;vertices+=o.geometry.attributes.position.count*n;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;for(let v of o.geometry.attributes.position.array)if(!Number.isFinite(v))invalid++;}});console.log(JSON.stringify({architecture:a.stats,garden:g.stats,vertices,triangles,invalid},null,2));if(invalid)process.exitCode=1;
