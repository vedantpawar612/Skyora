// SkeletonOverlay Component - Draws detected body landmarks and bones on camera preview
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { SKELETON_CONNECTIONS, LANDMARK_INDICES } from '../services/angleCalculator';
import { COLORS } from '../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SkeletonOverlay = ({
  landmarks,
  jointResults = {},
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
  showAngles = false,
  mirrorX = true,
}) => {
  if (!landmarks || landmarks.length < 33) return null;

  const safeJointResults = jointResults || {};

  // Check if coordinates are in screen pixels (values > 1.1) rather than normalized [0..1]
  const isScreenCoords = React.useMemo(() => {
    return landmarks.some(lm => Math.abs(lm.x) > 1.1 || Math.abs(lm.y) > 1.1);
  }, [landmarks]);

  const getJointColor = (index) => {
    // Map landmark index to joint name for color coding
    const jointMap = {
      [LANDMARK_INDICES.LEFT_ELBOW]: 'leftElbow',
      [LANDMARK_INDICES.RIGHT_ELBOW]: 'rightElbow',
      [LANDMARK_INDICES.LEFT_KNEE]: 'leftKnee',
      [LANDMARK_INDICES.RIGHT_KNEE]: 'rightKnee',
      [LANDMARK_INDICES.LEFT_SHOULDER]: 'leftShoulder',
      [LANDMARK_INDICES.RIGHT_SHOULDER]: 'rightShoulder',
      [LANDMARK_INDICES.LEFT_HIP]: 'leftHip',
      [LANDMARK_INDICES.RIGHT_HIP]: 'rightHip',
    };

    const jointName = jointMap[index];
    if (jointName && safeJointResults[jointName]) {
      const status = safeJointResults[jointName].status;
      switch (status) {
        case 'good': return COLORS.jointGood;
        case 'close': return COLORS.jointClose;
        case 'bad': return COLORS.jointBad;
      }
    }
    return COLORS.primary;
  };

  const getScreenCoords = (landmark) => {
    if (isScreenCoords) {
      // viewCoordinator has already scaled, rotated, and mirrored the point.
      // Draw it directly.
      return { x: landmark.x, y: landmark.y };
    }
    let x = landmark.x * width;
    if (mirrorX) x = width - x;
    const y = landmark.y * height;
    return { x, y };
  };

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Draw bones (lines connecting joints) */}
        {SKELETON_CONNECTIONS.map(([startIdx, endIdx], index) => {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          if (!start || !end) return null;
          if (start.visibility < 0.5 || end.visibility < 0.5) return null;

          const startCoords = getScreenCoords(start);
          const endCoords = getScreenCoords(end);

          return (
            <Line
              key={`bone-${index}`}
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke={COLORS.boneLine}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.8}
            />
          );
        })}

        {/* Draw joints (circles at landmarks) */}
        {landmarks.map((landmark, index) => {
          if (!landmark || landmark.visibility < 0.5) return null;

          // Only draw major landmarks
          const majorLandmarks = [
            0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
          ];
          if (!majorLandmarks.includes(index)) return null;

          const coords = getScreenCoords(landmark);
          const color = getJointColor(index);
          const isKeyJoint = [11, 12, 13, 14, 23, 24, 25, 26].includes(index);

          return (
            <React.Fragment key={`joint-${index}`}>
              {/* Glow effect */}
              <Circle
                cx={coords.x}
                cy={coords.y}
                r={isKeyJoint ? 10 : 6}
                fill={color}
                opacity={0.2}
              />
              {/* Joint dot */}
              <Circle
                cx={coords.x}
                cy={coords.y}
                r={isKeyJoint ? 6 : 4}
                fill={color}
                opacity={0.9}
              />
              {/* Inner highlight */}
              <Circle
                cx={coords.x}
                cy={coords.y}
                r={isKeyJoint ? 3 : 2}
                fill="#FFFFFF"
                opacity={0.6}
              />
            </React.Fragment>
          );
        })}

        {/* Draw angle labels if enabled */}
        {showAngles && Object.entries(safeJointResults).map(([jointName, result]) => {
          const jointToLandmark = {
            leftElbow: LANDMARK_INDICES.LEFT_ELBOW,
            rightElbow: LANDMARK_INDICES.RIGHT_ELBOW,
            leftKnee: LANDMARK_INDICES.LEFT_KNEE,
            rightKnee: LANDMARK_INDICES.RIGHT_KNEE,
            leftShoulder: LANDMARK_INDICES.LEFT_SHOULDER,
            rightShoulder: LANDMARK_INDICES.RIGHT_SHOULDER,
            leftHip: LANDMARK_INDICES.LEFT_HIP,
            rightHip: LANDMARK_INDICES.RIGHT_HIP,
          };

          const landmarkIdx = jointToLandmark[jointName];
          if (!landmarkIdx || !landmarks[landmarkIdx]) return null;

          const coords = getScreenCoords(landmarks[landmarkIdx]);

          return (
            <SvgText
              key={`angle-${jointName}`}
              x={coords.x + 12}
              y={coords.y - 8}
              fill="#FFFFFF"
              fontSize={10}
              fontWeight="bold"
            >
              {result.userAngle}°
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default SkeletonOverlay;
