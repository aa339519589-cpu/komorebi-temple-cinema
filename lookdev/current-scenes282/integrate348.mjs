import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const root=resolve(import.meta.dirname,'../..');
const selected=[
 {reference:2,before:'dc68c596e79e406e4a47015f901aee2f07c5a43ac66fd187c0ad559ba3b4c8a6',after:'fe30902dc6b9951315fbccfaa67b2288d76db7fd9349040692567bf4ba2ebf58',patch:'lookdev/scene02-craft342/r06-native-craft342.patch',candidate:'lookdev/scene02-craft342/candidate-r06',review:'Root personally viewed full, true hall crop and true overhead crop; visible eave support, stone connections and shadowed court return are working improvements; stylized geometry/materials remain.'},
 {reference:4,before:'aa17857cca07cd6e629fd1dcc5b1a85fc689568eafb46f0249be90a93fc7961a',after:'ae8efebc9dfaed1695519b6cdf5f90b8e3d7cd23be1598d18e7eb3b35cd888fc',patch:'lookdev/scene04-lantern343/r02-lantern343.patch',candidate:'lookdev/scene04-lantern343/candidate-r02',review:'Root personally viewed full, true lantern crop and low angle; stone cap/chamber/incisions improve, broad green base patches removed, stone remains too regular and pale.'},
 {reference:9,before:'4757862cf5799582aefaef4e6fe8d88b20945ce0cfcabc7bff38a5b3c8f2590f',after:'ce2d6ec6765554d4281c5d4b875f6d66c1ee5459478b1975d49c510afa043d46',patch:'lookdev/scene09-light341/delta341-r04.patch',candidate:'lookdev/scene09-light341/candidate-r04',review:'Root personally viewed full, true shore crop and low water view; actual lamp cases/shore feet/grounded plants added; water, plants, timber and layout remain below reference.'}
];
for(const s of selected){
 const id=String(s.reference).padStart(2,'0');
 if((await reconstructionSourceIdentity(root,id)).hash!==s.before)throw Error('Canonical base changed: '+id);
 if((await reconstructionSourceIdentity(resolve(root,s.candidate),id)).hash!==s.after)throw Error('Frozen reviewed source changed: '+id);
 execFileSync('git',['apply',s.patch],{cwd:root});
 if((await reconstructionSourceIdentity(root,id)).hash!==s.after)throw Error('Integration differs: '+id);
}
await writeFile(resolve(import.meta.dirname,'integration348.json'),JSON.stringify({status:'three-reviewed-working-models-integrated',selected,filmGIncludesThese:false,photographicAccepted:false,originalGoalComplete:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(selected.map(s=>({reference:s.reference,sourceHash:s.after}))));
