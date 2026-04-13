// Pose Comparison & AI Feedback Service
// Compares user's detected joint angles with ideal pose angles
// Generates corrective feedback instructions

const ANGLE_THRESHOLD = 15; // Degrees of acceptable deviation
const CLOSE_THRESHOLD = 25; // Degrees for "close but needs adjustment"

/**
 * Joint-specific feedback messages
 * Maps joint name + direction to a human-readable corrective instruction
 */
const FEEDBACK_MESSAGES = {
  leftElbow: {
    tooSmall: 'Straighten your left arm more',
    tooBig: 'Bend your left elbow more',
  },
  rightElbow: {
    tooSmall: 'Straighten your right arm more',
    tooBig: 'Bend your right elbow more',
  },
  leftKnee: {
    tooSmall: 'Straighten your left leg more',
    tooBig: 'Bend your left knee more',
  },
  rightKnee: {
    tooSmall: 'Straighten your right leg more',
    tooBig: 'Bend your right knee more',
  },
  leftShoulder: {
    tooSmall: 'Lower your left arm slightly',
    tooBig: 'Raise your left arm higher',
  },
  rightShoulder: {
    tooSmall: 'Lower your right arm slightly',
    tooBig: 'Raise your right arm higher',
  },
  leftHip: {
    tooSmall: 'Open your left hip more',
    tooBig: 'Straighten your left side',
  },
  rightHip: {
    tooSmall: 'Open your right hip more',
    tooBig: 'Straighten your right side',
  },
};

/**
 * Compare user angles with target angles and generate feedback
 * @param {Object} userAngles - Detected angles from calculateAllAngles
 * @param {Object} targetAngles - Ideal angles from pose data
 * @returns {Object} Comparison results with accuracy and feedback
 */
export const comparePose = (userAngles, targetAngles) => {
  if (!userAngles || !targetAngles) {
    return {
      overallAccuracy: 0,
      jointResults: {},
      feedback: ['Position yourself in the camera frame'],
      primaryFeedback: 'Position yourself in the camera frame',
    };
  }

  const jointResults = {};
  let totalAccuracy = 0;
  let jointCount = 0;
  const feedbackList = [];

  for (const [jointName, targetAngle] of Object.entries(targetAngles)) {
    const userAngle = userAngles[jointName];
    
    if (userAngle === undefined || userAngle === null) continue;

    const deviation = Math.abs(userAngle - targetAngle);
    const accuracy = Math.max(0, 100 - (deviation / 180) * 100);
    
    let status = 'good'; // Within threshold
    if (deviation > CLOSE_THRESHOLD) {
      status = 'bad';
    } else if (deviation > ANGLE_THRESHOLD) {
      status = 'close';
    }

    // Generate feedback if deviation exceeds threshold
    if (deviation > ANGLE_THRESHOLD && FEEDBACK_MESSAGES[jointName]) {
      const direction = userAngle < targetAngle ? 'tooBig' : 'tooSmall';
      const message = FEEDBACK_MESSAGES[jointName][direction];
      if (message) {
        feedbackList.push({
          joint: jointName,
          message,
          deviation,
          priority: deviation, // Higher deviation = higher priority
        });
      }
    }

    jointResults[jointName] = {
      userAngle,
      targetAngle,
      deviation,
      accuracy: Math.round(accuracy),
      status,
    };

    totalAccuracy += accuracy;
    jointCount++;
  }

  // Sort feedback by priority (highest deviation first)
  feedbackList.sort((a, b) => b.priority - a.priority);

  const overallAccuracy = jointCount > 0 ? Math.round(totalAccuracy / jointCount) : 0;

  // Get top 3 most important corrections
  const topFeedback = feedbackList.slice(0, 3).map(f => f.message);

  // Primary feedback (most urgent correction or encouragement)
  let primaryFeedback = 'Great form! Hold this pose.';
  if (overallAccuracy < 50) {
    primaryFeedback = topFeedback[0] || 'Adjust your position';
  } else if (overallAccuracy < 70) {
    primaryFeedback = topFeedback[0] || 'Almost there! Small adjustments needed.';
  } else if (overallAccuracy < 85) {
    primaryFeedback = topFeedback[0] || 'Good! Fine-tune your alignment.';
  }

  return {
    overallAccuracy,
    jointResults,
    feedback: topFeedback,
    primaryFeedback,
    allFeedback: feedbackList,
  };
};

/**
 * Get color for accuracy level
 */
export const getAccuracyColor = (accuracy) => {
  if (accuracy >= 80) return '#00E676';
  if (accuracy >= 60) return '#FFD600';
  return '#FF5252';
};

/**
 * Get status text for accuracy level
 */
export const getAccuracyStatus = (accuracy) => {
  if (accuracy >= 90) return 'Excellent!';
  if (accuracy >= 80) return 'Great Form!';
  if (accuracy >= 70) return 'Good Progress';
  if (accuracy >= 60) return 'Keep Trying';
  if (accuracy >= 40) return 'Needs Work';
  return 'Adjust Position';
};
