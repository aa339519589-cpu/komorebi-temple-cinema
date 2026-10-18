import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const scenes=(process.env.SCENES??'01,02,03,04,05,06,07,08,09,10').split(',');
for(const id of scenes){
  if(!/^\d{2}$/.test(id))throw Error('SCENES requires comma-separated two-digit IDs.');
  // Each child acquires/releases the exact same global GPU mutex as the
  // existing reconstruction and Cycles jobs; no parallel browsers are made.
  const child=spawn(process.execPath,[resolve(here,'render-preview.mjs')],{cwd:resolve(here,'../..'),env:{...process.env,SCENE:id,SHOT_TIMES:'0,3.5,7',ITERATION:process.env.ITERATION??'shotplan01'},stdio:'inherit'});
  await new Promise((yes,no)=>{child.once('error',no);child.once('exit',code=>code===0?yes():no(Error(`Actual shot preview ${id} failed (${code}).`)));});
}
