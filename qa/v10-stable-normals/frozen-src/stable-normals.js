// Prevent a degenerate derivative basis at tiny triangle/viewport edges from
// normalizing a zero vector. Use the geometric shading normal in that case;
// regular surfaces retain the original bump perturbation unchanged.
export function stableBumpChunk(chunk) {
  const start=chunk.indexOf('vec3 perturbNormalArb(');
  let end=chunk.indexOf('{',start),depth=0;
  if(start>=0&&end>=0)for(;end<chunk.length;end++){if(chunk[end]==='{')depth++;if(chunk[end]==='}'&&--depth===0){end++;break;}}
  if(start<0||end<0||depth!==0)throw Error('Pinned Three bump shader changed; re-audit the numerical patch.');
  return chunk.slice(0,start)+`vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
    vec3 sigmaX = dFdx( surf_pos.xyz );
    vec3 sigmaY = dFdy( surf_pos.xyz );
    float lx2 = dot( sigmaX, sigmaX ), ly2 = dot( sigmaY, sigmaY );
    if ( !( lx2 > 1e-20 ) || !( ly2 > 1e-20 ) ) return surf_norm;
    sigmaX *= inversesqrt( lx2 ); sigmaY *= inversesqrt( ly2 );
    vec3 r1 = cross( sigmaY, surf_norm ), r2 = cross( surf_norm, sigmaX );
    float determinant = dot( sigmaX, r1 ) * faceDirection;
    vec3 gradient = sign( determinant ) * ( dHdxy.x * r1 + dHdxy.y * r2 );
    vec3 bumped = abs( determinant ) * surf_norm - gradient;
    float length2 = dot( bumped, bumped );
    return length2 > 1e-20 ? bumped * inversesqrt( length2 ) : surf_norm;
}
`+chunk.slice(end);
}
