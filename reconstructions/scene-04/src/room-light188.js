// Finite doorway visibility for the room's indirect sky component. The actual
// directional and practical lights still use their real geometry shadows.
// This analytic opening integral is an explicit WebGL lighting approximation,
// not a baked image, ambient fill light, GI claim or screen-space correction.
export function installRoomSkyVisibility188(material,{origin=[.12,0,-.10],floorY=3.5}={}){
 if(!material||material.userData.roomSkyVisibility188)return;
 material.userData.roomSkyVisibility188=true;
 const prior=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material),cx=origin[0],portalZ=origin[2]-.72,cy=origin[1]+floorY+2.19;
 material.onBeforeCompile=(s,renderer)=>{
  prior.call(material,s,renderer);
  s.vertexShader='varying vec3 vRoom188World;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 room188Position=vec4(transformed,1.0);
#ifdef USE_INSTANCING
room188Position=instanceMatrix*room188Position;
#endif
vRoom188World=(modelMatrix*room188Position).xyz;`);
  s.fragmentShader=`varying vec3 vRoom188World;
float room188Corner(float x,float y,float d){return atan(x*y,d*sqrt(d*d+x*x+y*y));}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
float room188Depth=max(.08,${portalZ.toFixed(6)}-vRoom188World.z);
float room188X=vRoom188World.x-${cx.toFixed(6)},room188Y=vRoom188World.y-${cy.toFixed(6)};
float room188Omega=room188Corner(2.10-room188X,2.19-room188Y,room188Depth)-room188Corner(-2.10-room188X,2.19-room188Y,room188Depth)-room188Corner(2.10-room188X,-2.19-room188Y,room188Depth)+room188Corner(-2.10-room188X,-2.19-room188Y,room188Depth);
float room188Visibility=clamp(.07+.93*room188Omega/6.2831853,.07,1.0);
float room188Inside=smoothstep(.0,.30,${portalZ.toFixed(6)}-vRoom188World.z)*(1.0-smoothstep(2.12,2.45,abs(room188X)));
room188Inside*=smoothstep(${(floorY-.1).toFixed(6)},${(floorY+.1).toFixed(6)},vRoom188World.y)*(1.0-smoothstep(${(floorY+4.30).toFixed(6)},${(floorY+4.65).toFixed(6)},vRoom188World.y));
reflectedLight.indirectDiffuse*=mix(1.0,room188Visibility,room188Inside);
reflectedLight.indirectSpecular*=mix(1.0,sqrt(room188Visibility),room188Inside*${material.userData.localRoomEnvironment188?"0.0":"1.0"});`);
 };
 material.customProgramCacheKey=()=>key()+':finite-doorway-sky188-r02:local='+!!material.userData.localRoomEnvironment188;material.needsUpdate=true;
}
