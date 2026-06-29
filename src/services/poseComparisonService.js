// Pose Comparison & AI Feedback Service
// Compares user's detected joint angles with ideal pose angles
// Generates corrective feedback instructions
//
// FIXED: Direction logic was previously inverted (userAngle < targetAngle
// mapped to 'tooBig', producing backwards corrections).
// IMPROVED: Non-linear accuracy, weighted joints, severity-aware feedback.

const ANGLE_THRESHOLD = 15; // Degrees of acceptable deviation (good)
const CLOSE_THRESHOLD = 25; // Degrees for "close but needs adjustment"

/**
 * Joint-specific feedback messages.
 * Each joint has two severity levels per direction:
 *   - mild: for deviations 15-30° (gentle nudge)
 *   - strong: for deviations >30° (urgent correction)
 *
 * Direction meanings (CORRECTED):
 *   - tooSmall: user's angle is SMALLER than target (joint is more bent/closed)
 *     → needs to open/straighten
 *   - tooBig: user's angle is BIGGER than target (joint is more extended/open)
 *     → needs to close/bend
 */
const FEEDBACK_MESSAGES = {
  leftElbow: {
    tooSmall: { mild: 'Straighten your left arm a bit more', strong: 'Straighten your left arm' },
    tooBig:   { mild: 'Bend your left elbow a little', strong: 'Bend your left elbow more' },
  },
  rightElbow: {
    tooSmall: { mild: 'Straighten your right arm a bit more', strong: 'Straighten your right arm' },
    tooBig:   { mild: 'Bend your right elbow a little', strong: 'Bend your right elbow more' },
  },
  leftKnee: {
    tooSmall: { mild: 'Straighten your left leg a bit', strong: 'Straighten your left leg more' },
    tooBig:   { mild: 'Bend your left knee slightly', strong: 'Bend your left knee deeper' },
  },
  rightKnee: {
    tooSmall: { mild: 'Straighten your right leg a bit', strong: 'Straighten your right leg more' },
    tooBig:   { mild: 'Bend your right knee slightly', strong: 'Bend your right knee deeper' },
  },
  leftShoulder: {
    tooSmall: { mild: 'Raise your left arm a little', strong: 'Raise your left arm higher' },
    tooBig:   { mild: 'Lower your left arm slightly', strong: 'Lower your left arm' },
  },
  rightShoulder: {
    tooSmall: { mild: 'Raise your right arm a little', strong: 'Raise your right arm higher' },
    tooBig:   { mild: 'Lower your right arm slightly', strong: 'Lower your right arm' },
  },
  leftHip: {
    tooSmall: { mild: 'Open your left hip a bit', strong: 'Open your left hip more' },
    tooBig:   { mild: 'Close your left hip slightly', strong: 'Tuck your left hip in' },
  },
  rightHip: {
    tooSmall: { mild: 'Open your right hip a bit', strong: 'Open your right hip more' },
    tooBig:   { mild: 'Close your right hip slightly', strong: 'Tuck your right hip in' },
  },
};

/**
 * Non-linear accuracy calculation for a single joint.
 * Uses a piecewise curve that is:
 *   - Generous for small deviations (≤15°: 90-100%)
 *   - Drops quickly for moderate deviations (15-40°: 50-90%)
 *   - Very low for large deviations (>40°: 0-50%)
 *
 * This is more intuitive than the previous linear formula where
 * a 90° deviation still yielded ~50% accuracy.
 */
/**
 * Non-linear accuracy calculation for a single joint.
 * Uses a piecewise curve scaled by the joint's specific tolerance:
 *   - Generous for small deviations (≤ tolerance: 90-100%)
 *   - Drops quickly for moderate deviations (tolerance to 2.5x tolerance: 50-90%)
 *   - Very low for large deviations (2.5x to 6x tolerance: 0-50%)
 */
function calculateJointAccuracy(deviation, tolerance = ANGLE_THRESHOLD) {
  if (deviation <= tolerance) {
    // Good range: 90-100%
    return 100 - (deviation / tolerance) * 10;
  } else if (deviation <= tolerance * 2.5) {
    // Moderate range: 50-90%
    const range = (tolerance * 2.5) - tolerance;
    const progress = (deviation - tolerance) / range;
    return 90 - progress * 40;
  } else if (deviation <= tolerance * 6) {
    // Poor range: 10-50%
    const range = (tolerance * 6) - (tolerance * 2.5);
    const progress = (deviation - (tolerance * 2.5)) / range;
    return 50 - progress * 40;
  } else {
    // Very poor: 0-10%
    const range = tolerance * 6;
    const progress = Math.min(1, (deviation - (tolerance * 6)) / range);
    return 10 - progress * 10;
  }
}

/**
 * Compare user angles with target angles and generate feedback.
 *
 * @param {Object} userAngles   - Detected angles from calculateAllAngles
 * @param {Object} targetAngles - Ideal angles from pose data
 * @param {Object} [jointWeights] - Optional per-joint weights (0-1). Higher = more important.
 * @param {Object} [tolerances] - Optional per-joint tolerances.
 * @returns {Object} Comparison results with accuracy and feedback
 */
export const comparePose = (userAngles, targetAngles, jointWeights = null, tolerances = null) => {
  if (!userAngles || !targetAngles) {
    return {
      overallAccuracy: 0,
      jointResults: {},
      feedback: ['Position yourself in the camera frame'],
      primaryFeedback: 'Position yourself in the camera frame',
    };
  }

  const jointResults = {};
  let weightedAccuracySum = 0;
  let weightSum = 0;
  const feedbackList = [];

  for (const [jointName, targetAngle] of Object.entries(targetAngles)) {
    const userAngle = userAngles[jointName];

    // Explicitly check for null/undefined (Fix 2: Low visibility / invalid points return null)
    if (userAngle === undefined || userAngle === null) continue;

    const tolerance = (tolerances && tolerances[jointName]) || ANGLE_THRESHOLD;
    const closeTolerance = tolerance * 1.6;

    const deviation = Math.abs(userAngle - targetAngle);
    const accuracy = Math.max(0, Math.round(calculateJointAccuracy(deviation, tolerance)));

    // Joint importance weight (default 1.0 if not specified)
    const weight = (jointWeights && jointWeights[jointName]) || 1.0;

    let status = 'good';
    if (deviation > closeTolerance) {
      status = 'bad';
    } else if (deviation > tolerance) {
      status = 'close';
    }

    // Generate feedback if deviation exceeds tolerance
    if (deviation > tolerance && FEEDBACK_MESSAGES[jointName]) {
      const direction = userAngle < targetAngle ? 'tooSmall' : 'tooBig';
      const severity = deviation > (tolerance * 2) ? 'strong' : 'mild';
      const messageObj = FEEDBACK_MESSAGES[jointName][direction];
      const message = messageObj ? messageObj[severity] : null;

      if (message) {
        feedbackList.push({
          joint: jointName,
          message,
          deviation,
          weight,
          // Priority = deviation × weight, so important joints rank higher
          priority: deviation * weight,
          direction,
          severity,
        });
      }
    }

    jointResults[jointName] = {
      userAngle,
      targetAngle,
      deviation,
      accuracy,
      status,
      weight,
    };

    weightedAccuracySum += accuracy * weight;
    weightSum += weight;
  }

  // Sort feedback by priority (highest weighted deviation first)
  feedbackList.sort((a, b) => b.priority - a.priority);

  const overallAccuracy = weightSum > 0 ? Math.round(weightedAccuracySum / weightSum) : 0;

  // Get top 3 most important corrections
  const topFeedback = feedbackList.slice(0, 3).map(f => f.message);

  // Primary feedback — use the most critical specific correction
  // instead of generic accuracy-band messages
  let primaryFeedback = 'Great form! Hold this pose.';
  if (overallAccuracy < 40) {
    primaryFeedback = topFeedback[0] || 'Adjust your position to match the pose';
  } else if (overallAccuracy < 60) {
    primaryFeedback = topFeedback[0] || 'Keep adjusting, you are getting closer';
  } else if (overallAccuracy < 80) {
    primaryFeedback = topFeedback[0] || 'Almost there, fine-tune your alignment';
  } else if (overallAccuracy < 90) {
    primaryFeedback = topFeedback[0] || 'Good form! Small adjustments needed.';
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
  if (accuracy >= 60) return 'Keep Going';
  if (accuracy >= 40) return 'Adjust Position';
  return 'Follow Instructions';
};
