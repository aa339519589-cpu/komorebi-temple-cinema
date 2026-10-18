export async function inspectGaussianPly(url) {
  const response=await fetch(url,{headers:{Range:'bytes=0-65535'}});
  if(!response.ok)throw Error(`PLY header HTTP ${response.status}: ${url}`);
  const reader=response.body.getReader();let chunks=[],length=0,header='';
  const decoder=new TextDecoder();
  while(length<262144){const {done,value}=await reader.read();if(done)break;chunks.push(value);length+=value.byteLength;header+=decoder.decode(value,{stream:true});if(header.includes('end_header'))break;}
  await reader.cancel();
  header=header.slice(0,header.indexOf('end_header')+'end_header'.length);
  if(!header.startsWith('ply\n')&&!header.startsWith('ply\r\n'))throw Error('Expected standard Gaussian-splat PLY.');
  const format=header.match(/^format\s+(\S+)/m)?.[1];
  const vertexCount=Number(header.match(/^element vertex\s+(\d+)/m)?.[1]);
  const block=header.split(/^element vertex\s+\d+\s*$/m)[1]?.split(/^element\s/m)[0]??'';
  const properties=[...block.matchAll(/^property\s+(\S+)\s+(\S+)\s*$/gm)].map(m=>({type:m[1],name:m[2]}));
  const names=new Set(properties.map(p=>p.name));
  const required=['x','y','z','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3','opacity','f_dc_0','f_dc_1','f_dc_2'];
  const missing=required.filter(n=>!names.has(n));
  if(missing.length||!vertexCount)throw Error(`Not a complete standard 3DGS PLY; missing ${missing.join(', ')||'vertex count'}.`);
  const shRest=properties.filter(p=>/^f_rest_\d+$/.test(p.name)).length;
  const degree=Math.sqrt(1+shRest/3)-1;
  if(!Number.isInteger(degree)||degree>3)throw Error(`Unsupported SH layout (${shRest} f_rest properties).`);
  return {format,vertexCount,properties,shDegree:degree,representation:'anisotropic 3D Gaussian: position, log-scale + quaternion covariance, SH radiance, logit opacity',sourcePropertySemantics:{scales:'exp(scale_0..2)',rotation:'rot_0..3 = w,x,y,z',opacity:'sigmoid(opacity)',radiance:'0.5 + SH0*C0, plus f_rest degree1..3 when present'},header};
}
