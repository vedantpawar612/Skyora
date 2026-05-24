export const PRANAYAM_TECHNIQUES = [
  {
    id: 'sama_vritti',
    name: 'Equal Breathing',
    sanskritName: 'Sama Vritti',
    description: 'A simple technique of breathing where the inhale and exhale are of equal length. Excellent for calming the mind, lowering blood pressure, and reducing stress.',
    benefits: ['Reduces anxiety', 'Improves focus', 'Slows heart rate'],
    defaultCycles: 10,
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe in deeply through the nose' },
      { name: 'Hold', duration: 4, instruction: 'Hold the breath gently' },
      { name: 'Exhale', duration: 4, instruction: 'Exhale slowly through the nose' },
      { name: 'Hold Empty', duration: 4, instruction: 'Hold the breath out' },
    ],
    color: '#00D9A6', // Accent
  },
  {
    id: '478_breath',
    name: 'Relaxing Breath',
    sanskritName: '4-7-8 Pranayam',
    description: 'Developed by Dr. Andrew Weil, this pattern acts as a natural tranquilizer for the nervous system. Highly effective for falling asleep quickly.',
    benefits: ['Aids sleep', 'Manages cravings', 'Controls anger responses'],
    defaultCycles: 4,
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Inhale quietly through the nose' },
      { name: 'Hold', duration: 7, instruction: 'Hold the breath' },
      { name: 'Exhale', duration: 8, instruction: 'Exhale completely through the mouth' },
    ],
    color: '#6C63FF', // Primary
  },
  {
    id: 'kapalbhati',
    name: 'Skull Shining Breath',
    sanskritName: 'Kapalbhati',
    description: 'An advanced, energizing breathing technique consisting of short, powerful exhales and passive inhales. Helps detoxify the body and clear the mind.',
    benefits: ['Boosts energy', 'Improves digestion', 'Clears respiratory tract'],
    defaultCycles: 3, // In this context, 1 cycle will represent 1 sequence of fast breathing
    phases: [
      { name: 'Prepare', duration: 3, instruction: 'Take a deep breath in to prepare' },
      // Because Kapalbhati is rapid, we simulate a 30 second "Active Exhale" block
      { name: 'Active Exhales', duration: 30, instruction: 'Forceful exhales, passive inhales' },
      { name: 'Rest', duration: 10, instruction: 'Breathe normally and observe' },
    ],
    color: '#FFD600', // Warning (Yellow/Energizing)
  },
  {
    id: 'anulom_vilom',
    name: 'Alternate Nostril Breathing',
    sanskritName: 'Anulom Vilom',
    description: 'A balancing breath that harmonizes the left and right hemispheres of the brain. You alternate breathing through the left and right nostrils.',
    benefits: ['Balances nervous system', 'Increases lung capacity', 'Improves sleep quality'],
    defaultCycles: 6,
    phases: [
      { name: 'Inhale Left', duration: 4, instruction: 'Close right nostril, inhale left' },
      { name: 'Hold', duration: 4, instruction: 'Close both nostrils and hold' },
      { name: 'Exhale Right', duration: 4, instruction: 'Open right nostril, exhale right' },
      { name: 'Inhale Right', duration: 4, instruction: 'Keep left closed, inhale right' },
      { name: 'Hold', duration: 4, instruction: 'Close both nostrils and hold' },
      { name: 'Exhale Left', duration: 4, instruction: 'Open left nostril, exhale left' },
    ],
    color: '#FF5252', // Error (Red) - using existing theme colors for variety
  },
];
