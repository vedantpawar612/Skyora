// Splash Screen - Animated app launch screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../config/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo appears with scale
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Glow effect
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fades in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Brief pause
      Animated.delay(800),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.background]}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={[styles.decorCircle, styles.circle1]} />
        <View style={[styles.decorCircle, styles.circle2]} />
        <View style={[styles.decorCircle, styles.circle3]} />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
          <Image 
            source={require('../../assets/skyora.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          }}
        >
          <Text style={styles.title}>Skyora</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Your Intelligent Yoga Coach
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={[styles.loadingContainer, { opacity: subtitleOpacity }]}>
          <View style={[styles.loadingDot, { backgroundColor: COLORS.primary }]} />
          <View style={[styles.loadingDot, { backgroundColor: COLORS.accent }]} />
          <View style={[styles.loadingDot, { backgroundColor: COLORS.primaryLight }]} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    left: -width * 0.3,
  },
  circle2: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: -width * 0.2,
    right: -width * 0.2,
    borderColor: 'rgba(0, 217, 166, 0.1)',
  },
  circle3: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.15,
    right: -width * 0.1,
    borderColor: 'rgba(108, 99, 255, 0.05)',
  },
  logoContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 30,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.display,
    ...FONTS.extraBold,
    textAlign: 'center',
    letterSpacing: -1,
  },
  titleAccent: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.display,
    ...FONTS.extraBold,
    textAlign: 'center',
    letterSpacing: -1,
    marginTop: -8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    marginTop: SPACING.md,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.xxl,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default SplashScreen;
