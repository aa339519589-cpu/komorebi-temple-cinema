import * as T from 'three';

// Thin-lens circle of confusion, followed by a deterministic post gather.
// Optical dimensions are authored camera choices; there is no reference EXIF.
// The gather is an approximation: one depth layer cannot reconstruct hidden
// foreground colour or separate a Fresnel-blended reflection's focus planes.
export function installCircleOfConfusion03(lens,{width,height,camera}){
 const old='float radius=clamp(abs(1./max(viewDepth,.1)-1./focusDistance)*2.6,0.,2.4);';
 if(!lens.fragmentShader.includes(old)||!lens.fragmentShader.includes('for(int i=0;i<12;i++)'))throw Error('Pinned scene03 lens shader changed');
 Object.assign(lens.uniforms,{focalLengthMetres:{value:.0325},fNumber:{value:2.8},sensorHeightMetres:{value:.036},viewportHeight:{value:height},cropMagnification:{value:1}});
 lens.fragmentShader=lens.fragmentShader
  .replace('uniform mat4 inverseProjection;','uniform mat4 inverseProjection;uniform float focalLengthMetres;uniform float fNumber;uniform float sensorHeightMetres;uniform float viewportHeight;uniform float cropMagnification;')
  .replace(old,'float circleMetres=focalLengthMetres*focalLengthMetres*abs(1.-focusDistance/max(viewDepth,.1))/(fNumber*max(.05,focusDistance-focalLengthMetres));float radius=min(18.,.5*circleMetres/sensorHeightMetres*viewportHeight*cropMagnification);')
  .replace('for(int i=0;i<12;i++)','for(int i=0;i<64;i++)')
  .replace('sqrt((fi+.5)/12.)','sqrt((fi+.5)/64.)');
 lens.needsUpdate=true;
 lens.userData.optics={sensorHeightMetres:.036,fNumber:2.8,maximumBlurRadiusPixels:18,gatherSamples:65,referenceEXIFKnown:false,photographicAcceptance:false,limitations:'Screen-depth post approximation; not a multi-ray aperture integration'};
 updateCircleOfConfusion03(lens,camera);
}
export function updateCircleOfConfusion03(lens,camera){
 // Derive focal length from the uncropped vertical FOV, never projection[5],
 // which changes under the native off-axis detail view.
 lens.uniforms.focalLengthMetres.value=.018/Math.tan(T.MathUtils.degToRad(camera.fov)*.5);
 lens.uniforms.cropMagnification.value=camera.view?.enabled?camera.view.fullHeight/camera.view.height:1;
}
