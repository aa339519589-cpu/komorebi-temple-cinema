// Three r186's LTC area-light basis normalizes a zero tangent when view and
// shading normal coincide. Test this narrow numerical fix against raw HDR
// cubemap readbacks; it is not an exposure clamp or a lighting replacement.
export function stableAreaLightChunk(chunk) {
  const original='T1 = normalize( V - N * dot( V, N ) );';
  if(!chunk.includes(original))throw Error('Pinned Three LTC shader changed; re-audit the numerical patch.');
  return chunk.replace(original,`vec3 viewTangent = V - N * dot( V, N );
  float tangentLength2 = dot( viewTangent, viewTangent );
  if ( tangentLength2 > 1e-10 ) {
    T1 = viewTangent * inversesqrt( tangentLength2 );
  } else {
    vec3 helperAxis = abs( N.z ) < .999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 0.0, 1.0, 0.0 );
    T1 = normalize( cross( helperAxis, N ) );
  }`);
}
