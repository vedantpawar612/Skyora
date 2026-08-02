// GhostOverlay - Translucent target-pose silhouette rendered over the camera.
// User aligns their body into the ghost; joints glow red/amber/green based on deviation.

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { SKELETON_CONNECTIONS, LANDMARK_INDICES } from '../services/angleCalculator';
import { COLORS } from '../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const JOINT_TO_LANDMARK = {
  leftElbow: LANDMARK_INDICES.LEFT_ELBOW,
  rightElbow: LANDMARK_INDICES.RIGHT_ELBOW,
  leftKnee: LANDMARK_INDICES.LEFT_KNEE,
  rightKnee: LANDMARK_INDICES.RIGHT_KNEE,
  leftShoulder: LANDMARK_INDICES.LEFT_SHOULDER,
  rightShoulder: LANDMARK_INDICES.RIGHT_SHOULDER,
  leftHip: LANDMARK_INDICES.LEFT_HIP,
  rightHip: LANDMARK_INDICES.RIGHT_HIP,
};

const LANDMARK_TO_JOINT = Object.fromEntries(
  Object.entries(JOINT_TO_LANDMARK).map(([k, v]) => [v, k])
);

const statusColor = (status) => {
  switch (status) {
    case 'good': return COLORS.jointGood;
    case 'close': return COLORS.jointClose;
    case 'bad': return COLORS.jointBad;
    default: return '#9AA4B2';
  }
};

const MAJOR_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

const GhostOverlay = ({
  targetLandmarks,
  jointResults = {},
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
  mirrorX = true,
  holding = false,
}) => {
  if (!targetLandmarks || targetLandmarks.length < 33) return null;

  const project = (lm) => {
    let x = lm.x * width;
    if (mirrorX) x = width - x;
    return { x, y: lm.y * height };
  };

  const jointStatuses = Object.values(jointResults);
  const allGoodNow = jointStatuses.length > 0 && jointStatuses.every((j) => j.status === 'good');
  const boneColor = holding ? (allGoodNow ? COLORS.jointGood : COLORS.jointClose) : '#FFFFFF';
  const boneOpacity = holding ? 0.35 : 0.22;
  const boneGlowOpacity = holding ? 0.18 : 0.12;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {SKELETON_CONNECTIONS.map(([aIdx, bIdx], i) => {
          const a = targetLandmarks[aIdx];
          const b = targetLandmarks[bIdx];
          if (!a || !b) return null;
          const pa = project(a);
          const pb = project(b);
          return (
            <React.Fragment key={`bone-${i}`}>
              <Line
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={boneColor}
                strokeWidth={22}
                strokeLinecap="round"
                opacity={boneGlowOpacity}
              />
              <Line
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={boneColor}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={boneOpacity}
              />
            </React.Fragment>
          );
        })}

        {targetLandmarks.map((lm, idx) => {
          if (!MAJOR_LANDMARKS.includes(idx)) return null;
          const p = project(lm);
          const jointName = LANDMARK_TO_JOINT[idx];
          const status = jointName && jointResults[jointName] ? jointResults[jointName].status : null;
          const color = statusColor(status);
          const isKey = [11, 12, 13, 14, 23, 24, 25, 26].includes(idx);
          const outerR = isKey ? 18 : 12;
          const innerR = isKey ? 9 : 6;
          return (
            <React.Fragment key={`ghost-joint-${idx}`}>
              {holding && status === 'good' && (
                <Circle cx={p.x} cy={p.y} r={outerR + 6} fill={COLORS.jointGood} opacity={0.28} />
              )}
              <Circle cx={p.x} cy={p.y} r={outerR} fill={color} opacity={0.18} />
              <Circle cx={p.x} cy={p.y} r={innerR} fill={color} opacity={0.4} />
              <Circle cx={p.x} cy={p.y} r={Math.max(2, innerR - 4)} fill="#FFFFFF" opacity={0.35} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
});

export default GhostOverlay;
