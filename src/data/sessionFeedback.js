// Session Feedback — Per-joint improvement tips for post-session reports.
// Each joint has direction-specific tips (tooSmall = too bent/closed, tooBig = too open/extended)
// and general improvement advice with exercises.

/**
 * Human-readable joint names and L/R pairing for the report UI.
 * Joints are paired so the report shows "Shoulders" instead of separate L/R entries.
 */
export const JOINT_PAIRS = [
  { key: 'shoulders', left: 'leftShoulder', right: 'rightShoulder', name: 'Shoulders', icon: 'body-outline' },
  { key: 'hips',      left: 'leftHip',      right: 'rightHip',      name: 'Hips',      icon: 'fitness-outline' },
  { key: 'elbows',    left: 'leftElbow',     right: 'rightElbow',    name: 'Elbows',    icon: 'hand-left-outline' },
  { key: 'knees',     left: 'leftKnee',      right: 'rightKnee',    name: 'Knees',     icon: 'walk-outline' },
];

/**
 * Per-joint improvement tips with direction-specific position change advice.
 * - tooSmall: user's angle is smaller than target (more bent/closed than needed)
 * - tooBig: user's angle is bigger than target (more extended/open than needed)
 */
export const JOINT_TIPS = {
  leftShoulder: {
    name: 'Left Shoulder',
    tips: {
      tooSmall: 'Raise your arms higher and open your shoulders wider.',
      tooBig: 'Lower your arms slightly — they are extended too far.',
      general: 'Work on shoulder mobility to maintain proper arm alignment.',
    },
    exercises: ['Arm circles', 'Wall angels', 'Shoulder rolls'],
  },
  rightShoulder: {
    name: 'Right Shoulder',
    tips: {
      tooSmall: 'Raise your arms higher and open your shoulders wider.',
      tooBig: 'Lower your arms slightly — they are extended too far.',
      general: 'Work on shoulder mobility to maintain proper arm alignment.',
    },
    exercises: ['Arm circles', 'Wall angels', 'Shoulder rolls'],
  },
  leftHip: {
    name: 'Left Hip',
    tips: {
      tooSmall: 'Open your hips more — try to create a wider hip angle.',
      tooBig: 'Close your hip angle — your hips are too open or too low.',
      general: 'Practice hip-opening stretches to improve flexibility.',
    },
    exercises: ['Pigeon pose', 'Hip circles', 'Butterfly stretch'],
  },
  rightHip: {
    name: 'Right Hip',
    tips: {
      tooSmall: 'Open your hips more — try to create a wider hip angle.',
      tooBig: 'Close your hip angle — your hips are too open or too low.',
      general: 'Practice hip-opening stretches to improve flexibility.',
    },
    exercises: ['Pigeon pose', 'Hip circles', 'Butterfly stretch'],
  },
  leftElbow: {
    name: 'Left Elbow',
    tips: {
      tooSmall: 'Straighten your left arm more — avoid bending at the elbow.',
      tooBig: 'Bend your left elbow slightly — do not hyperextend.',
      general: 'Focus on keeping arms active and engaged throughout the pose.',
    },
    exercises: ['Plank holds', 'Arm extensions', 'Push-up variations'],
  },
  rightElbow: {
    name: 'Right Elbow',
    tips: {
      tooSmall: 'Straighten your right arm more — avoid bending at the elbow.',
      tooBig: 'Bend your right elbow slightly — do not hyperextend.',
      general: 'Focus on keeping arms active and engaged throughout the pose.',
    },
    exercises: ['Plank holds', 'Arm extensions', 'Push-up variations'],
  },
  leftKnee: {
    name: 'Left Knee',
    tips: {
      tooSmall: 'Straighten your left leg more — work toward full extension.',
      tooBig: 'Bend your left knee more — it should not be locked straight.',
      general: 'Improve hamstring flexibility to allow straighter leg alignment.',
    },
    exercises: ['Forward fold', 'Hamstring stretches', 'Leg raises'],
  },
  rightKnee: {
    name: 'Right Knee',
    tips: {
      tooSmall: 'Straighten your right leg more — work toward full extension.',
      tooBig: 'Bend your right knee more — it should not be locked straight.',
      general: 'Improve hamstring flexibility to allow straighter leg alignment.',
    },
    exercises: ['Forward fold', 'Hamstring stretches', 'Leg raises'],
  },
};

/**
 * Get the most relevant position-change tip for a joint based on its
 * most frequent deviation direction during the session.
 *
 * @param {string} jointName - e.g. 'leftShoulder'
 * @param {Object} feedbackCount - { tooSmall: number, tooBig: number }
 * @returns {{ tip: string, direction: string, exercises: string[] }}
 */
export function getJointImprovementTip(jointName, feedbackCount = {}) {
  const jointInfo = JOINT_TIPS[jointName];
  if (!jointInfo) {
    return { tip: 'Focus on maintaining proper alignment.', direction: 'general', exercises: [] };
  }

  const tooSmallCount = feedbackCount?.tooSmall || 0;
  const tooBigCount = feedbackCount?.tooBig || 0;

  let direction = 'general';
  if (tooSmallCount > 0 || tooBigCount > 0) {
    direction = tooSmallCount >= tooBigCount ? 'tooSmall' : 'tooBig';
  }

  return {
    tip: jointInfo.tips[direction] || jointInfo.tips.general,
    direction,
    exercises: jointInfo.exercises,
  };
}

/**
 * Get overall session performance message based on accuracy.
 */
export function getPerformanceMessage(accuracy) {
  if (accuracy >= 90) return { title: 'Excellent Work! 🎉', subtitle: 'Your alignment was outstanding.' };
  if (accuracy >= 75) return { title: 'Great Progress! 💪', subtitle: 'Strong form with minor adjustments needed.' };
  if (accuracy >= 60) return { title: 'Good Effort! 👍', subtitle: 'Keep practicing to refine your alignment.' };
  return { title: 'Keep Practicing! 🧘', subtitle: 'Focus on the tips below to improve.' };
}
