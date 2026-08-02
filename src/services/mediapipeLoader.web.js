// Runtime loader for @mediapipe/tasks-vision.
//
// The package cannot be imported normally: its bundle contains a dynamic
// `import(expr)` that Metro rejects at build time ("Invalid call ... import").
// So the bundle is copied into public/ (see scripts/copy-mediapipe-wasm.js)
// and pulled in here with a module <script> tag, outside the Metro graph.

const LOADER_URL = '/mediapipe/vision-loader.js';
const LOAD_TIMEOUT_MS = 30000;

let visionPromise = null;

export const loadVision = () => {
  if (visionPromise) return visionPromise;

  visionPromise = new Promise((resolve, reject) => {
    if (window.__skyoraVision) {
      resolve(window.__skyoraVision);
      return;
    }

    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('skyora-vision-ready', onReady);
      fn(arg);
    };

    // A module script that fails its inner import reports through window.onerror
    // rather than script.onerror, so a timeout is the reliable failure path.
    const timer = setTimeout(
      () => finish(reject, new Error('MediaPipe vision bundle timed out')),
      LOAD_TIMEOUT_MS
    );
    const onReady = () => finish(resolve, window.__skyoraVision);

    window.addEventListener('skyora-vision-ready', onReady, { once: true });

    const script = document.createElement('script');
    script.type = 'module';
    script.src = LOADER_URL;
    script.onerror = () => finish(reject, new Error('failed to fetch ' + LOADER_URL));
    document.head.appendChild(script);
  }).catch((err) => {
    visionPromise = null; // allow a retry on the next call
    throw err;
  });

  return visionPromise;
};
