const status=document.querySelector('#status'),button=document.querySelector('#render'),save=document.querySelector('#save');
const sceneVariant=new URLSearchParams(location.search).get('scene')||'shared';
const select=document.querySelector('#view');if(sceneVariant==='reference10-porch'){select.value='10';select.disabled=true;status.textContent='参考10条件 E：一个近吊灯按原图三片纸面约束重建并接在真实前梁上，替换旧灯而非叠加；纸面、法线深度与四点光预算已配套。此为非唯一建模假设，托盘/全局相机及桥塔树仍未照片验收。不自动构建或上传。';}
let loaded=false,buildMs=null;
button.onclick=async()=>{button.disabled=true;save.disabled=true;try{
 const manifest=await fetch('/frozen-manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('MANIFEST_'+r.status);return r.json()});
 if(!loaded){status.textContent='正在构造真实场景；尚无渲染结果。';history.replaceState(null,'','/?render&defer&w=960&h=960&scene='+encodeURIComponent(sceneVariant));const start=performance.now();await import('./src/main.js');buildMs=performance.now()-start;loaded=true;}
 const reference=Number(document.querySelector('#view').value);const start=performance.now();const frame=window.temple.renderReference(reference);const frameMs=performance.now()-start;const info=window.temple.info();status.textContent=JSON.stringify({revision:manifest.revision,sceneVariant,reference,mode:info.lightingMode,cameraStatus:frame.cameraStatus,renderer:info.gpu,buildMs,frameMs,resolution:info.resolution,note:'时间为浏览器观测；GPU/软件性质须按实际 renderer 判断。此包无自动回传。'},null,2);save.disabled=false;
}catch(e){status.textContent='失败：'+String(e?.message??e);}finally{button.disabled=false;}};
save.onclick=()=>window.temple.renderer.domElement.toBlob(blob=>{if(!blob){status.textContent+='\nPNG 导出失败';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='komorebi-v62-'+sceneVariant+'-'+document.querySelector('#view').value+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');
window.addEventListener('pagehide',()=>{if(!window.temple)return;try{window.temple.disposeRoomEnvironment();window.temple.composer.dispose();window.temple.renderer.dispose();window.temple.renderer.forceContextLoss();}catch{}});
