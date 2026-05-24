// Joint Angle Calculator
// Calculates angles between three body landmarks using vector math

/**
 * Calculate the angle at point B formed by points A, B, and C
 * Uses the dot product formula: angle = arccos((BA · BC) / (|BA| * |BC|))
 * 
 * @param {Object} pointA - {x, y} coordinates
 * @param {Object} pointB - {x, y} vertex point
 * @param {Object} pointC - {x, y} coordinates
 * @returns {number} Angle in degrees (0-180)
 */
export const calculateAngle = (pointA, pointB, pointC) => {
  if (!pointA || !pointB || !pointC) return 0;

  const vectorBA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };

  const vectorBC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  // Dot product
  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;

  // Magnitudes
  const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
  const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);

  // Avoid division by zero
  if (magnitudeBA === 0 || magnitudeBC === 0) return 0;

  // Calculate angle
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magnitudeBA * magnitudeBC)));
  const angleRadians = Math.acos(cosAngle);
  const angleDegrees = angleRadians * (180 / Math.PI);

  return Math.round(angleDegrees);
};

/**
 * Body landmark indices (MediaPipe Pose standard - 33 points)
 * Using subset for major joint angles
 */
export const LANDMARK_INDICES = {
  // Face
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  
  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  
  // Hands
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  
  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Calculate all relevant joint angles from detected landmarks
 * @param {Array} landmarks - Array of {x, y, z, visibility} landmarks
 * @returns {Object} Named angles in degrees
 */
export const calculateAllAngles = (landmarks) => {
  if (!landmarks || landmarks.length < 33) return null;

  const L = LANDMARK_INDICES;

  return {
    // Elbow angles (shoulder → elbow → wrist)
    leftElbow: calculateAngle(
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_ELBOW],
      landmarks[L.LEFT_WRIST]
    ),
    rightElbow: calculateAngle(
      landmarks[L.RIGHT_SHOULDER],
      landmarks[L.RIGHT_ELBOW],
      landmarks[L.RIGHT_WRIST]
    ),

    // Knee angles (hip → knee → ankle)
    leftKnee: calculateAngle(
      landmarks[L.LEFT_HIP],
      landmarks[L.LEFT_KNEE],
      landmarks[L.LEFT_ANKLE]
    ),
    rightKnee: calculateAngle(
      landmarks[L.RIGHT_HIP],
      landmarks[L.RIGHT_KNEE],
      landmarks[L.RIGHT_ANKLE]
    ),

    // Shoulder angles (elbow → shoulder → hip)
    leftShoulder: calculateAngle(
      landmarks[L.LEFT_ELBOW],
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_HIP]
    ),
    rightShoulder: calculateAngle(
      landmarks[L.RIGHT_ELBOW],
      landmarks[L.RIGHT_SHOULDER],
      landmarks[L.RIGHT_HIP]
    ),

    // Hip angles (shoulder → hip → knee)
    leftHip: calculateAngle(
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_HIP],
      landmarks[L.LEFT_KNEE]
    ),
    rightHip: calculateAngle(
      landmarks[L.RIGHT_SHOULDER],
      landmarks[L.RIGHT_HIP],
      landmarks[L.RIGHT_KNEE]
    ),
  };
};

/**
 * Skeleton bone connections for drawing
 * Each pair defines a line segment between two landmark indices
 */
export const SKELETON_CONNECTIONS = [
  // Face
  [LANDMARK_INDICES.LEFT_EAR, LANDMARK_INDICES.LEFT_EYE],
  [LANDMARK_INDICES.RIGHT_EAR, LANDMARK_INDICES.RIGHT_EYE],
  [LANDMARK_INDICES.LEFT_EYE, LANDMARK_INDICES.NOSE],
  [LANDMARK_INDICES.RIGHT_EYE, LANDMARK_INDICES.NOSE],

  // Torso
  [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.RIGHT_SHOULDER],
  [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_HIP],
  [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_HIP],
  [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP],

  // Left arm
  [LANDMARK_INDICES.LEFT_SHOULDER, LANDMARK_INDICES.LEFT_ELBOW],
  [LANDMARK_INDICES.LEFT_ELBOW, LANDMARK_INDICES.LEFT_WRIST],

  // Right arm
  [LANDMARK_INDICES.RIGHT_SHOULDER, LANDMARK_INDICES.RIGHT_ELBOW],
  [LANDMARK_INDICES.RIGHT_ELBOW, LANDMARK_INDICES.RIGHT_WRIST],

  // Left leg
  [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.LEFT_KNEE],
  [LANDMARK_INDICES.LEFT_KNEE, LANDMARK_INDICES.LEFT_ANKLE],

  // Right leg
  [LANDMARK_INDICES.RIGHT_HIP, LANDMARK_INDICES.RIGHT_KNEE],
  [LANDMARK_INDICES.RIGHT_KNEE, LANDMARK_INDICES.RIGHT_ANKLE],

  // Feet
  [LANDMARK_INDICES.LEFT_ANKLE, LANDMARK_INDICES.LEFT_HEEL],
  [LANDMARK_INDICES.LEFT_ANKLE, LANDMARK_INDICES.LEFT_FOOT_INDEX],
  [LANDMARK_INDICES.RIGHT_ANKLE, LANDMARK_INDICES.RIGHT_HEEL],
  [LANDMARK_INDICES.RIGHT_ANKLE, LANDMARK_INDICES.RIGHT_FOOT_INDEX],
];
