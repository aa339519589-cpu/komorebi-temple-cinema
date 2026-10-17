import { ExternalTexture, PCFShadowMap, DepthFormat, UnsignedIntType, LinearFilter, ClampToEdgeWrapping, LessEqualCompare, GreaterEqualCompare } from '../vendor/build/three.module.js';

// Opt-in, pinned r186 candidate. No scene rendering happens here. Original
// per-light maps, cameras, caster traversal and update/dispose remain untouched.
// The six completed maps are copied 1:1 into a single comparison-depth array.
export function createRestorationWindowShadowArray(renderer) {
  if (!renderer?.isWebGLRenderer || renderer.restorationWindowShadowArrayRevision !== 'six-window-depth-copy-v1' || renderer.restorationWindowShadowArray) throw new Error('A dedicated, unregistered WebGLRenderer is required.');
  let sources = null, state = 'unregistered', busy = false, resource = null, valid = false, disposed = false;
  const external = new ExternalTexture();
  external.name = 'restoration-six-window-shadow-array';
  external.isDataArrayTexture = true;
  external.isDepthTexture = true;
  external.isRenderTargetTexture = true; // bypass generic upload; owner owns GL storage
  external.format = DepthFormat; external.type = UnsignedIntType;
  external.minFilter = external.magFilter = LinearFilter;
  external.wrapS = external.wrapT = ClampToEdgeWrapping;
  external.generateMipmaps = false;
  const fail = message => { throw new Error(`Window shadow array: ${message}`); };
  const live = () => { if (state === 'terminal') fail('terminal owner; retire this renderer/world instead of silently restoring the over-budget route.'); };
  function attemptAll(actions, primary, hasPrimary = false) {
    const errors = hasPrimary ? [primary] : [];
    for (const action of actions) try { action(); } catch (error) { errors.push(error); }
    if (errors.length === 1) throw errors[0];
    if (errors.length) throw new AggregateError(errors, 'Window shadow array operation/cleanup failed.');
  }
  function release(r) {
    if (!r) return;
    const gl = renderer.getContext();
    attemptAll([
      () => { if (r.read) gl.deleteFramebuffer(r.read); },
      () => { if (r.draw) gl.deleteFramebuffer(r.draw); },
      () => { if (r.texture) gl.deleteTexture(r.texture); },
    ]);
  }
  function register(lights) {
    live();
    if (busy || sources || state !== 'unregistered') fail('register exactly once, before rendering.');
    if (!Array.isArray(lights) || lights.length !== 6 || new Set(lights).size !== 6) fail('six explicit unique window-light identities required.');
    for (const light of lights) if (!light?.isSpotLight || light.castShadow !== true || light.map != null || !light.shadow) fail('registered sources must be unmapped shadow-casting SpotLights.');
    const size = lights[0].shadow.mapSize;
    if (![256,512,1024].includes(size.x) || size.x !== size.y || lights.some(l => l.shadow.mapSize.x !== size.x || l.shadow.mapSize.y !== size.y)) fail('one identical supported window resolution required.');
    sources = Object.freeze([...lights]); state = 'registered';
  }
  function matches(lights) {
    live();
    if (!sources) return false;
    const count = sources.filter(l => lights.includes(l)).length;
    if (count === 0) return false;
    if (count !== 6 || sources.some(l => lights.filter(x => x === l).length !== 1)) fail('partial or duplicate registered light collection is outside this narrow candidate.');
    if (renderer.shadowMap.type !== PCFShadowMap) fail('only the existing PCF mode is supported; no silent Basic/VSM conversion.');
    return true;
  }
  function shape() {
    const gl = renderer.getContext();
    if (gl.isContextLost()) { contextLost(); fail('context lost.'); }
    if (renderer.shadowMap.type !== PCFShadowMap) fail('PCF required.');
    const maps = sources.map(l => l.shadow.map);
    if (maps.some(m => !m || m.samples !== 0 || m.isWebGLCubeRenderTarget)) fail('six completed, non-multisampled original 2D maps required.');
    const width = maps[0].width, height = maps[0].height;
    const comparison = renderer.state.buffers.depth.getReversed() ? GreaterEqualCompare : LessEqualCompare;
    if (![256,512,1024].includes(width) || height !== width) fail('unsupported source resolution.');
    for (let i = 0; i < 6; i++) {
      const light = sources[i], map = maps[i], t = map.depthTexture;
      if (light.map != null || !light.castShadow || map.width !== width || map.height !== height || light.shadow.mapSize.x !== width || light.shadow.mapSize.y !== height) fail('source identity, size or cast state changed.');
      if (!t?.isDepthTexture || t.isCubeTexture || t.format !== DepthFormat || t.type !== UnsignedIntType || t.compareFunction !== comparison || t.minFilter !== LinearFilter || t.magFilter !== LinearFilter || t.wrapS !== ClampToEdgeWrapping || t.wrapT !== ClampToEdgeWrapping || t.generateMipmaps || t.image.width !== width || t.image.height !== height) fail('original depth format/filter/compare contract differs.');
      if (!renderer.properties.get(t).__webglTexture) fail('source texture is not initialized by the original shadow pass.');
    }
    return {gl, maps, width, height, comparison};
  }
  function synchronize(shadowLights) {
    live();
    if (!sources || !matches(shadowLights)) return false;
    if (busy) fail('reentrant copy rejected.');
    busy = true; valid = false;
    let saved = null, pending = null, retired = null, primary, hasPrimary = false;
    try {
      const {gl, maps, width, height, comparison} = shape();
      if (typeof gl.framebufferTextureLayer !== 'function' || typeof gl.texStorage3D !== 'function' || gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS) < 6) fail('WebGL2 depth-array interface unavailable.');
      if (gl.getError() !== gl.NO_ERROR) fail('pre-existing GL error; no attempt to hide or attribute it to this copy.');
      // Raw GL operations restore the exact actual bindings. No renderer cache is
      // modified and no renderer callback runs while these bindings are temporary.
      saved = {gl, read:gl.getParameter(gl.READ_FRAMEBUFFER_BINDING), draw:gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING), active:gl.getParameter(gl.ACTIVE_TEXTURE), array:gl.getParameter(gl.TEXTURE_BINDING_2D_ARRAY), scissor:gl.isEnabled(gl.SCISSOR_TEST)};
      gl.disable(gl.SCISSOR_TEST);
      const replace = !resource || resource.width !== width || resource.height !== height || resource.comparison !== comparison;
      if (replace) {
        pending = {width,height,comparison,texture:null,read:null,draw:null};
        pending.texture = gl.createTexture(); pending.read = gl.createFramebuffer(); pending.draw = gl.createFramebuffer();
        if (!pending.texture || !pending.read || !pending.draw) fail('partial GL allocation.');
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, pending.texture);
        gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH_COMPONENT24, width, height, 6);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_COMPARE_FUNC, comparison === LessEqualCompare ? gl.LEQUAL : gl.GEQUAL);
      }
      const r = pending || resource;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, r.read); gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, r.draw); gl.drawBuffers([gl.NONE]);
      for (let layer = 0; layer < 6; layer++) {
        const source = renderer.properties.get(maps[layer].depthTexture).__webglTexture;
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, source, 0);
        gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, r.texture, 0, layer);
        if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE || gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) fail(`incomplete depth framebuffer at layer ${layer}.`);
        if (gl.getFramebufferAttachmentParameter(gl.READ_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE) !== 24 || gl.getFramebufferAttachmentParameter(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE) !== 24) fail('depth bit width differs.');
        gl.blitFramebuffer(0,0,width,height,0,0,width,height,gl.DEPTH_BUFFER_BIT,gl.NEAREST);
        if (gl.getError() !== gl.NO_ERROR) fail(`depth blit failed at layer ${layer}.`);
      }
      if (pending) {
        retired = resource; resource = pending; pending = null;
        external.sourceTexture = resource.texture;
        external.image = {width,height,depth:6}; external.compareFunction = comparison;

      }
      valid = true; state = 'ready';
    } catch (error) { primary = error; hasPrimary = true; }
    finally {
      const actions = [];
      if (saved) {
        const s = saved, gl = s.gl;
        actions.push(() => gl.bindFramebuffer(gl.READ_FRAMEBUFFER,s.read), () => gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,s.draw), () => gl.activeTexture(s.active), () => gl.bindTexture(gl.TEXTURE_2D_ARRAY,s.array), () => s.scissor ? gl.enable(gl.SCISSOR_TEST) : gl.disable(gl.SCISSOR_TEST));
      }
      const restorationErrors = [];
      for (const action of actions) try { action(); } catch (error) { restorationErrors.push(error); }
      const cleanup = [];
      if (pending) cleanup.push(() => release(pending));
      if (retired) cleanup.push(() => release(retired));
      if (restorationErrors.length) { state = 'terminal'; valid = false; }
      busy = false;
      try { attemptAll([...restorationErrors.map(error => () => { throw error; }), ...cleanup], primary, hasPrimary); }
      catch (error) { valid = false; throw error; }
    }
    return true;
  }
  function uniforms(lights) {
    if (!matches(lights)) return null;
    if (!valid || !resource || state !== 'ready') fail('no complete current array; original samplers are not a hidden fallback.');
    const layers = new Float32Array(lights.length), indices = new Int32Array(lights.length), unpooled = [];
    lights.forEach((light,i) => {
      const layer = sources.indexOf(light); layers[i] = layer;
      indices[i] = layer < 0 ? unpooled.push(light.shadow.map.depthTexture) - 1 : -1;
    });
    return {texture:external,layers,indices,unpooled};
  }
  function contextLost() {
    // WebGL handles are invalidated by the browser. Terminal until a new renderer
    // is created; no automatic resumption with stale maps or over-budget shaders.
    valid = false; state = 'terminal'; resource = null; external.sourceTexture = null;
  }
  function dispose() {
    if (busy) fail('dispose during copy rejected.');
    if (disposed) return;
    disposed = true; state = 'terminal'; valid = false;
    const old = resource; resource = null; external.sourceTexture = null;
    attemptAll([() => release(old), () => renderer.properties.remove(external), () => external.dispose()]);
  }
  const owner = Object.freeze({register,matches,synchronize,uniforms,contextLost,dispose,get state(){return state;},get sources(){return sources;}});
  renderer.restorationWindowShadowArray = owner;
  return owner;
}
