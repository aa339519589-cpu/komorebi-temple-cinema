// Use the existing independent CC0 sky capture for actual cloud detail.
// The procedural ellipsoid cloud field from174 remains preserved in its
// source snapshot and actual frames; no supplied reference pixels are used.
export function installAtmosphere109({scene,skyDome}){
 skyDome.visible=false;
 scene.backgroundIntensity=1.18;
 scene.environmentIntensity=.72;
 return{revision:180,background:'Existing independent Poly Haven Kloofendal48d Partly Cloudy Pure Sky',asset:'assets/daylight108/sky-2k.hdr',license:'CC0-1.0',backgroundIntensity:1.18,environmentIntensity:.72,cloudSource:'Actual HDR sky capture; procedural ellipsoid lobes removed',solarDirection:'Same captured sky solar peak and retained azimuth as108/174',nativeDiffuseGI:false,newHdrAsset:false,referenceImageUsed:false};
}
