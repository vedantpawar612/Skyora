// Pose Engine (web) - real pose detection via MediaPipe Tasks Vision.
// Reads frames from the <video> element owned by CameraSurface.web.js and
// keeps the latest detection available for the session loop via read().
//
// Coordinate contract: read() returns landmarks in screen-normalized space —
// the video-frame coords projected through the same object-fit: cover
// transform the preview uses, so overlays line up with the visible pixels.
// Angles are computed separately in aspect-corrected (isotropic) video space
// so joint angles are physically meaningful regardless of viewport shape.
import { loadVision } from './mediapipeLoader.web';
import { calculateAllAngles } from './angleCalculator';

// Served from public/ (Metro web dev) and dist/ (expo export / Electron app://)
const WASM_PATH = '/mediapipe/wasm';
const MODEL_PATH = '/mediapipe/models/pose_landmarker_lite.task';

const DETECT_MIN_INTERVAL_MS = 66; // ~15 fps detection cap
const STALE_RESULT_MS = 1000;

class PoseEngine {
  constructor() {
    this.isReal = true;
    this.status = 'idle'; // idle | loading | ready | error
    this.landmarker = null;
    this.video = null;
    this.viewport = null;
    this.running = false;
    this.rafId = null;
    this.lastDetectAt = 0;
    this.lastVideoTime = -1;
    this.latest = null;
  }

  async init() {
    if (this.landmarker || this.status === 'loading') return;
    this.status = 'loading';
    try {
      const { FilesetResolver, PoseLandmarker } = await loadVision();
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      const makeOptions = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL_PATH, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(fileset, makeOptions('GPU'));
      } catch (gpuErr) {
        console.warn('[poseEngine] GPU delegate failed, falling back to CPU', gpuErr);
        this.landmarker = await PoseLandmarker.createFromOptions(fileset, makeOptions('CPU'));
      }
      this.status = 'ready';
    } catch (err) {
      console.warn('[poseEngine] failed to load MediaPipe pose landmarker', err);
      this.status = 'error';
    }
  }

  attachVideo(video) {
    this.video = video;
  }

  setViewport(width, height) {
    this.viewport = { width, height };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastVideoTime = -1;
    const tick = () => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(tick);
      this._detect();
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _detect() {
    const video = this.video;
    if (!this.landmarker || !video || video.readyState < 2) return;

    const now = performance.now();
    if (now - this.lastDetectAt < DETECT_MIN_INTERVAL_MS) return;
    if (video.currentTime === this.lastVideoTime) return;
    this.lastDetectAt = now;
    this.lastVideoTime = video.currentTime;

    let result;
    try {
      result = this.landmarker.detectForVideo(video, now);
    } catch (err) {
      console.warn('[poseEngine] detectForVideo failed', err);
      return;
    }

    const videoLandmarks = result.landmarks && result.landmarks[0];
    if (!videoLandmarks || videoLandmarks.length < 33) {
      this.latest = null;
      return;
    }

    this.latest = {
      landmarks: this._toScreenSpace(videoLandmarks),
      angles: this._computeAngles(videoLandmarks),
      timestamp: now,
    };
  }

  _computeAngles(videoLandmarks) {
    const aspect = this.video.videoWidth / (this.video.videoHeight || 1);
    const isotropic = videoLandmarks.map((p) => ({ x: p.x * aspect, y: p.y }));
    return calculateAllAngles(isotropic);
  }

  // Project video-normalized coords through the object-fit: cover transform
  // into viewport-normalized coords. Overlays apply the mirror flip themselves.
  _toScreenSpace(videoLandmarks) {
    const vw = this.video.videoWidth || 1;
    const vh = this.video.videoHeight || 1;
    const { width: W, height: H } = this.viewport || { width: vw, height: vh };
    const scale = Math.max(W / vw, H / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;
    return videoLandmarks.map((p) => ({
      x: (ox + p.x * dw) / W,
      y: (oy + p.y * dh) / H,
      z: p.z,
      visibility: p.visibility != null ? p.visibility : 1,
    }));
  }

  read() {
    if (!this.latest) return null;
    if (performance.now() - this.latest.timestamp > STALE_RESULT_MS) return null;
    return this.latest;
  }

  getStatus() {
    return this.status;
  }

  dispose() {
    this.stop();
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.latest = null;
    this.status = 'idle';
  }
}

export default new PoseEngine();
