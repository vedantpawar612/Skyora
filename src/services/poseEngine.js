// Pose Engine (native) - demo fallback used in Expo Go / native builds,
// where real ML needs a custom dev build. Mirrors the interface of
// poseEngine.web.js, which runs real MediaPipe detection.
import poseDetectionService from './poseDetectionService';
import { calculateAllAngles } from './angleCalculator';

class PoseEngine {
  constructor() {
    this.isReal = false;
    this.status = 'ready'; // idle | loading | ready | error
    this.demoProgress = 0.5;
  }

  async init() {}

  attachVideo() {}

  setViewport() {}

  start() {
    this.demoProgress = 0.5;
  }

  stop() {}

  // Returns { landmarks, angles } in screen-normalized coordinates.
  read(targetAngles) {
    this.demoProgress = Math.min(0.95, this.demoProgress + (Math.random() - 0.3) * 0.05);
    const landmarks = poseDetectionService.generateDemoLandmarks(targetAngles, this.demoProgress);
    return { landmarks, angles: calculateAllAngles(landmarks) };
  }

  getStatus() {
    return this.status;
  }

  dispose() {}
}

export default new PoseEngine();
