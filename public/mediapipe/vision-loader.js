// Loaded as <script type="module"> by src/services/mediapipeLoader.web.js.
// Exists so the MediaPipe bundle stays out of the Metro graph — Metro cannot
// bundle it (dynamic `import(expr)` inside), but the browser loads it fine.
import * as vision from './vision_module.js';

window.__skyoraVision = vision;
window.dispatchEvent(new Event('skyora-vision-ready'));
