// Target Pose Renderer
// Builds a 33-point MediaPipe-shaped skeleton from pose.targetAngles via simple
// 2D forward kinematics, then aligns it to overlay on the user's torso.

import { LANDMARK_INDICES } from './angleCalculator';

const TORSO_LEN = 0.25;
const SHOULDER_WIDTH = 0.2;
const HIP_WIDTH = 0.1;
const UPPER_ARM_LEN = 0.15;
const FOREARM_LEN = 0.13;
const THIGH_LEN = 0.2;
const SHIN_LEN = 0.2;
const NECK_LEN = 0.08;
const FOOT_LEN = 0.05;

const TARGET_SHOULDER_CENTER = { x: 0.5, y: 0.35 };

const TO_RAD = Math.PI / 180;

const rotate = (v, thetaDeg) => {
  const t = thetaDeg * TO_RAD;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};

const add = (p, v) => ({ x: p.x + v.x, y: p.y + v.y });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const scaleVec = (v, s) => ({ x: v.x * s, y: v.y * s });
const mag = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
const normalize = (v) => {
  const m = mag(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
};

const pt = (x, y, visibility = 0.99) => ({ x, y, z: 0, visibility });

const buildArm = (shoulderPt, hipPt, shoulderDeg, elbowDeg, sideSign) => {
  const toHip = normalize(sub(hipPt, shoulderPt));
  const upperDir = rotate(toHip, sideSign * shoulderDeg);
  const elbow = add(shoulderPt, scaleVec(upperDir, UPPER_ARM_LEN));
  const fromElbowToShoulder = scaleVec(upperDir, -1);
  const forearmDir = rotate(fromElbowToShoulder, sideSign * elbowDeg);
  const wrist = add(elbow, scaleVec(forearmDir, FOREARM_LEN));
  return { elbow, wrist };
};

// Mirrors buildArm: each segment is placed by rotating the direction the joint
// angle is measured against, so calculateAllAngles reads the target back out
// exactly. Measuring from absolute vertical instead would bake in the ~11 deg
// lean of the shoulder-to-hip line.
const buildLeg = (hipPt, shoulderPt, hipDeg, kneeDeg, sideSign) => {
  const toShoulder = normalize(sub(shoulderPt, hipPt));
  const thighDir = rotate(toShoulder, sideSign * hipDeg);
  const knee = add(hipPt, scaleVec(thighDir, THIGH_LEN));
  const fromKneeToHip = scaleVec(thighDir, -1);
  const shinDir = rotate(fromKneeToHip, sideSign * kneeDeg);
  const ankle = add(knee, scaleVec(shinDir, SHIN_LEN));
  return { knee, ankle };
};

export const buildTargetLandmarks = (targetAngles = {}) => {
  const {
    leftShoulder = 10, rightShoulder = 10,
    leftElbow = 170, rightElbow = 170,
    leftHip = 175, rightHip = 175,
    leftKnee = 175, rightKnee = 175,
  } = targetAngles;

  const sc = TARGET_SHOULDER_CENTER;
  const hc = { x: sc.x, y: sc.y + TORSO_LEN };

  const lS = { x: sc.x - SHOULDER_WIDTH / 2, y: sc.y };
  const rS = { x: sc.x + SHOULDER_WIDTH / 2, y: sc.y };
  const lH = { x: hc.x - HIP_WIDTH / 2, y: hc.y };
  const rH = { x: hc.x + HIP_WIDTH / 2, y: hc.y };

  // Arm sideSign: +1 opens the arm outward for the LEFT shoulder, -1 for the RIGHT.
  const leftArm = buildArm(lS, lH, leftShoulder, leftElbow, +1);
  const rightArm = buildArm(rS, rH, rightShoulder, rightElbow, -1);
  // Leg sideSign: +1 opens the thigh outward for the LEFT hip, -1 for the RIGHT.
  const leftLeg = buildLeg(lH, lS, leftHip, leftKnee, +1);
  const rightLeg = buildLeg(rH, rS, rightHip, rightKnee, -1);

  const nose = { x: sc.x, y: sc.y - NECK_LEN };

  const lm = new Array(33);
  lm[0] = pt(nose.x, nose.y);
  lm[1] = pt(nose.x - 0.01, nose.y - 0.01);
  lm[2] = pt(nose.x - 0.02, nose.y - 0.01);
  lm[3] = pt(nose.x - 0.03, nose.y - 0.01);
  lm[4] = pt(nose.x + 0.01, nose.y - 0.01);
  lm[5] = pt(nose.x + 0.02, nose.y - 0.01);
  lm[6] = pt(nose.x + 0.03, nose.y - 0.01);
  lm[7] = pt(nose.x - 0.04, nose.y);
  lm[8] = pt(nose.x + 0.04, nose.y);
  lm[9] = pt(nose.x - 0.01, nose.y + 0.02);
  lm[10] = pt(nose.x + 0.01, nose.y + 0.02);
  lm[11] = pt(lS.x, lS.y);
  lm[12] = pt(rS.x, rS.y);
  lm[13] = pt(leftArm.elbow.x, leftArm.elbow.y);
  lm[14] = pt(rightArm.elbow.x, rightArm.elbow.y);
  lm[15] = pt(leftArm.wrist.x, leftArm.wrist.y);
  lm[16] = pt(rightArm.wrist.x, rightArm.wrist.y);
  const lw = leftArm.wrist;
  const rw = rightArm.wrist;
  lm[17] = pt(lw.x - 0.01, lw.y + 0.02);
  lm[18] = pt(rw.x + 0.01, rw.y + 0.02);
  lm[19] = pt(lw.x, lw.y + 0.025);
  lm[20] = pt(rw.x, rw.y + 0.025);
  lm[21] = pt(lw.x + 0.01, lw.y + 0.015);
  lm[22] = pt(rw.x - 0.01, rw.y + 0.015);
  lm[23] = pt(lH.x, lH.y);
  lm[24] = pt(rH.x, rH.y);
  lm[25] = pt(leftLeg.knee.x, leftLeg.knee.y);
  lm[26] = pt(rightLeg.knee.x, rightLeg.knee.y);
  lm[27] = pt(leftLeg.ankle.x, leftLeg.ankle.y);
  lm[28] = pt(rightLeg.ankle.x, rightLeg.ankle.y);
  lm[29] = pt(leftLeg.ankle.x - 0.01, leftLeg.ankle.y + 0.01);
  lm[30] = pt(rightLeg.ankle.x + 0.01, rightLeg.ankle.y + 0.01);
  lm[31] = pt(leftLeg.ankle.x + FOOT_LEN / 2, leftLeg.ankle.y + 0.015);
  lm[32] = pt(rightLeg.ankle.x - FOOT_LEN / 2, rightLeg.ankle.y + 0.015);

  return lm;
};

export const alignToUserBody = (targetLandmarks, userLandmarks, fallbackAnchor = null) => {
  if (!targetLandmarks || !userLandmarks) {
    return { landmarks: targetLandmarks, anchor: fallbackAnchor };
  }

  const L = LANDMARK_INDICES;
  const uLS = userLandmarks[L.LEFT_SHOULDER];
  const uRS = userLandmarks[L.RIGHT_SHOULDER];
  const uLH = userLandmarks[L.LEFT_HIP];
  const uRH = userLandmarks[L.RIGHT_HIP];

  const visibleEnough = (p) => p && p.visibility >= 0.5;
  let anchor;

  if (visibleEnough(uLS) && visibleEnough(uRS) && visibleEnough(uLH) && visibleEnough(uRH)) {
    const userShoulderCenter = { x: (uLS.x + uRS.x) / 2, y: (uLS.y + uRS.y) / 2 };
    const userHipCenter = { x: (uLH.x + uRH.x) / 2, y: (uLH.y + uRH.y) / 2 };
    const userTorsoLen = mag(sub(userHipCenter, userShoulderCenter)) || TORSO_LEN;
    anchor = { shoulderCenter: userShoulderCenter, scale: userTorsoLen / TORSO_LEN };
  } else if (fallbackAnchor) {
    anchor = fallbackAnchor;
  } else {
    return { landmarks: targetLandmarks, anchor: null };
  }

  const s = anchor.scale;
  const transformed = targetLandmarks.map((l) => ({
    x: anchor.shoulderCenter.x + (l.x - TARGET_SHOULDER_CENTER.x) * s,
    y: anchor.shoulderCenter.y + (l.y - TARGET_SHOULDER_CENTER.y) * s,
    z: l.z,
    visibility: l.visibility,
  }));

  return { landmarks: transformed, anchor };
};
