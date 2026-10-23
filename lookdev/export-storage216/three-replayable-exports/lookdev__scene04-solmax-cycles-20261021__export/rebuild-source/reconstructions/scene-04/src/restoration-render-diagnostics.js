// Persistent technical-only diagnostics. No image, shader source, scene payload,
// URL/query string, credential, or error stack is retained. Existing Three debug
// reporting remains in place; the pinned vendor invokes this additional hook.
export function installRestorationRenderDiagnostics(renderer) {
  if (!renderer?.isWebGLRenderer || !renderer.debug || !renderer.domElement?.addEventListener) throw new TypeError('A WebGLRenderer is required for render diagnostics.');
  if (renderer.debug.onRestorationShaderDiagnostic != null) throw new Error('Render diagnostics are already registered.');
  const errors = [];
  let stage = 'renderer-ready', contextFailureRecorded = false;
  const technicalText = value => typeof value === 'string' ? value : '';
  const safely = (read, fallback = null) => { try { return read(); } catch { return fallback; } };
  function add(entry) { errors.push(Object.freeze({sequence:errors.length + 1,stage,...entry})); }
  function lost() { return safely(() => renderer.getContext().isContextLost(), true) !== false; }
  function recordContextFailure() {
    if (!contextFailureRecorded) { contextFailureRecorded = true; add({kind:'context-lost'}); }
  }
  const hook = (gl, program, vertexShader, fragmentShader, programLog, vertexLog, fragmentLog) => {
    const bool = read => { const v=safely(read); return typeof v==='boolean'?v:null; };
    add({kind:'shader-program-failure',linked:bool(() => gl.getProgramParameter(program,gl.LINK_STATUS)),vertexCompiled:bool(() => gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)),fragmentCompiled:bool(() => gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)),programLog:technicalText(programLog),vertexLog:technicalText(vertexLog),fragmentLog:technicalText(fragmentLog)});
  };
  renderer.debug.checkShaderErrors = true;
  renderer.debug.onRestorationShaderDiagnostic = hook;
  renderer.domElement.addEventListener('webglcontextlost',recordContextFailure);
  // Restoration never clears the failed job: a fresh renderer/job is required.
  renderer.domElement.addEventListener('webglcontextrestored',() => add({kind:'context-restored-after-loss'}));
  function guardsValid() { return renderer.debug.checkShaderErrors === true && renderer.debug.onRestorationShaderDiagnostic === hook; }
  function snapshot() {
    const contextLost = lost(), guardValid = guardsValid();
    return Object.freeze({revision:'persistent-render-diagnostics-v1',stage,failed:errors.length > 0 || contextLost || !guardValid,contextLost,guardValid,errors:Object.freeze(errors.map(e => Object.freeze({...e})))});
  }
  function assertHealthy() {
    if (lost()) recordContextFailure();
    if (!guardsValid()) {
      if (!errors.some(e=>e.kind==='diagnostic-guard-changed')) add({kind:'diagnostic-guard-changed'});
    }
    if (errors.length) {
      const error = new Error('Render job failed; inspect the persistent technical diagnostics snapshot.');
      error.name = 'RestorationRenderFailure';
      throw error;
    }
  }
  function run(nextStage, callback) {
    if (typeof nextStage !== 'string' || !/^[a-z0-9-]{1,80}$/.test(nextStage) || typeof callback !== 'function') throw new TypeError('A fixed technical stage label and synchronous callback are required.');
    const previous = stage; stage = nextStage;
    try {
      assertHealthy();
      const value=callback();
      if(value && typeof value.then==='function') throw new TypeError('Render diagnostic stages must be synchronous.');
      assertHealthy();
      return value;
    } catch(error) {
      // Preserve the exact thrown value, including falsey values. Its message or
      // stack may contain unrelated data and is deliberately not copied.
      if (!errors.length) add({kind:'stage-exception',exceptionType:error instanceof Error?'Error':typeof error});
      throw error;
    } finally { stage = previous; }
  }
  return Object.freeze({snapshot,assertHealthy,run});
}
