// Copies the MediaPipe Tasks Vision runtime into public/ so it is served by
// Metro web in dev and included in dist/ by `expo export -p web`.
//
// The ES module bundle is copied too (not imported from node_modules) because
// it contains a dynamic `import(expr)` that Metro refuses to bundle. It is
// loaded at runtime instead — see public/mediapipe/vision-loader.js.
const fs = require('fs');
const path = require('path');

const pkgDir = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision');
const wasmSrcDir = path.join(pkgDir, 'wasm');
const mediapipeDir = path.join(__dirname, '..', 'public', 'mediapipe');
const wasmDestDir = path.join(mediapipeDir, 'wasm');

if (!fs.existsSync(wasmSrcDir)) {
  console.error('[copy-mediapipe-wasm] @mediapipe/tasks-vision not installed — run npm install first.');
  process.exit(1);
}

fs.mkdirSync(wasmDestDir, { recursive: true });

let copied = 0;
for (const file of fs.readdirSync(wasmSrcDir)) {
  if (!/^vision_wasm.*\.(js|wasm)$/.test(file)) continue;
  fs.copyFileSync(path.join(wasmSrcDir, file), path.join(wasmDestDir, file));
  copied += 1;
}

if (copied === 0) {
  console.error('[copy-mediapipe-wasm] no vision_wasm files found in ' + wasmSrcDir);
  process.exit(1);
}

// Named .js rather than .mjs so every static server infers a JS MIME type.
const moduleSrc = path.join(pkgDir, 'vision_bundle.mjs');
if (!fs.existsSync(moduleSrc)) {
  console.error('[copy-mediapipe-wasm] vision_bundle.mjs missing from ' + pkgDir);
  process.exit(1);
}
fs.copyFileSync(moduleSrc, path.join(mediapipeDir, 'vision_module.js'));

console.log(`[copy-mediapipe-wasm] copied ${copied} wasm files + vision_module.js to public/mediapipe`);
