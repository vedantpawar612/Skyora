import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../config/theme';
import ttsService from '../services/ttsService';

const { width } = Dimensions.get('window');

const BreathingSessionScreen = ({ route, navigation }) => {
  const { technique } = route.params;

  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeLeftInPhase, setTimeLeftInPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Animation values
  const circleScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Timer ref to manage the generic countdown
  const timerRef = useRef(null);
  
  // State refs so intervals access latest state
  const phaseRef = useRef(0);
  const cycleRef = useRef(1);
  const timeRef = useRef(0);
  const playingRef = useRef(false);

  useEffect(() => {
    // Initial setup
    const firstPhase = technique.phases[0];
    setTimeLeftInPhase(firstPhase.duration);
    timeRef.current = firstPhase.duration;
    
    // Announce start
    ttsService.speak(`Starting ${technique.name}. Follow the breathing guide.`);
    
    return () => {
      // Cleanup
      clearTimeout(timerRef.current);
      ttsService.stop();
    };
  }, []);

  const triggerAnimation = (phaseName, duration) => {
    // Determine the target scale based on whether it's an inhale or exhale
    let targetScale = 1;
    if (phaseName.toLowerCase().includes('inhale')) targetScale = 2.2;
    if (phaseName.toLowerCase().includes('exhale')) targetScale = 1.0;
    if (phaseName.toLowerCase().includes('hold')) return; // No scale change

    Animated.timing(circleScale, {
      toValue: targetScale,
      duration: duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const advancePhase = () => {
    let nextPhaseIdx = phaseRef.current + 1;
    let nextCycle = cycleRef.current;

    if (nextPhaseIdx >= technique.phases.length) {
      nextPhaseIdx = 0;
      nextCycle += 1;
    }

    if (nextCycle > technique.defaultCycles) {
      // Session finished
      endSession();
      return;
    }

    const nextPhase = technique.phases[nextPhaseIdx];
    
    // Update State
    phaseRef.current = nextPhaseIdx;
    cycleRef.current = nextCycle;
    timeRef.current = nextPhase.duration;

    setCurrentPhaseIndex(nextPhaseIdx);
    setCurrentCycle(nextCycle);
    setTimeLeftInPhase(nextPhase.duration);

    // Speak Instruction
    ttsService.speak(nextPhase.name);

    // Trigger Animation
    triggerAnimation(nextPhase.name, nextPhase.duration);
  };

  const runTick = () => {
    if (!playingRef.current) return;

    if (timeRef.current > 1) {
      // Just subtract a second
      timeRef.current -= 1;
      setTimeLeftInPhase(timeRef.current);
      timerRef.current = setTimeout(runTick, 1000);
    } else {
      // Phase ended, move to next
      advancePhase();
      // Restart interval
      timerRef.current = setTimeout(runTick, 1000);
    }
  };

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    playingRef.current = newState;
    
    if (newState) {
      // Start/Resume
      const currentPhase = technique.phases[phaseRef.current];
      triggerAnimation(currentPhase.name, timeRef.current);
      
      // If we are at the very beginning of a new phase, announce it
      if (timeRef.current === currentPhase.duration) {
         ttsService.speak(currentPhase.name);
      }
      
      timerRef.current = setTimeout(runTick, 1000);
    } else {
      // Pause
      clearTimeout(timerRef.current);
      circleScale.stopAnimation();
    }
  };

  const endSession = () => {
    setIsFinished(true);
    setIsPlaying(false);
    playingRef.current = false;
    clearTimeout(timerRef.current);
    ttsService.speak(`Session complete. Notice how your body and mind feel.`);
  };

  const currentPhase = technique.phases[currentPhaseIndex];

  if (isFinished) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <View style={styles.finishContainer}>
             <Ionicons name="checkmark-circle" size={100} color={technique.color} />
             <Text style={styles.finishTitle}>Session Complete!</Text>
             <Text style={styles.finishSubtitle}>{technique.name}</Text>
             <Text style={styles.finishStats}>{technique.defaultCycles} Cycles completed</Text>
             
             <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.doneBtnText}>Done</Text>
             </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{technique.name}</Text>
            <Text style={styles.headerCycle}>Cycle {currentCycle} of {technique.defaultCycles}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Animation & Timer Area */}
        <View style={styles.animationArea}>
          {/* Breathing Circle */}
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                backgroundColor: technique.color + '20', // Opacity added
                borderColor: technique.color,
                transform: [{ scale: circleScale }],
              }
            ]}
          />
          
          <View style={styles.centerTextContainer}>
             <Text style={styles.timerText}>{timeLeftInPhase}</Text>
             <Text style={styles.phaseText}>{currentPhase.name}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{currentPhase.instruction}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: isPlaying ? COLORS.backgroundElevated : technique.color }]}
            onPress={togglePlay}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color={isPlaying ? COLORS.textPrimary : COLORS.background}
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  headerCycle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  animationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    borderWidth: 2,
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  timerText: {
    color: COLORS.textPrimary,
    fontSize: 72,
    ...FONTS.extraBold,
  },
  phaseText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  instructionContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    minHeight: 100,
  },
  instructionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.medium,
    textAlign: 'center',
    lineHeight: 28,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  finishContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  finishTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.display,
    ...FONTS.extraBold,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  finishSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.regular,
    marginBottom: SPACING.lg,
  },
  finishStats: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
    marginBottom: SPACING.xxl * 2,
  },
  doneBtn: {
    backgroundColor: COLORS.surfaceBorder,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.round,
  },
  doneBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
  },
});

export default BreathingSessionScreen;
