// Forgot Password Screen - Premium dark themed password recovery
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Animated, StatusBar, Dimensions, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import GradientButton from '../../components/GradientButton';
import authService from '../../services/authService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_MAX_WIDTH = 460;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const loopBlob = (node, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(node, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(node, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();

    loopBlob(blob1, 6000);
    loopBlob(blob2, 7500);
  }, []);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');
    const { error: resetError } = await authService.resetPassword(email.trim());
    setLoading(false);

    if (resetError) {
      setError(resetError);
    } else {
      setSent(true);
      Animated.spring(checkAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  };

  const blob1Transform = {
    transform: [
      { translateX: blob1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
      { translateY: blob1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
    ],
  };
  const blob2Transform = {
    transform: [
      { translateX: blob2.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
      { translateY: blob2.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={['#05081A', COLORS.background, '#0F1437']} style={styles.gradient}>
        <Animated.View style={[styles.blob, styles.blobPrimary, blob1Transform]} />
        <Animated.View style={[styles.blob, styles.blobAccent, blob2Transform]} />
        <View style={styles.blobOverlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.centerWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Back button */}
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>

              {sent ? (
                <View style={styles.successContainer}>
                  <Animated.View
                    style={[
                      styles.checkRing,
                      {
                        transform: [
                          { scale: checkAnim },
                          {
                            rotate: checkAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['-90deg', '0deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.checkGradient}
                    >
                      <Ionicons name="checkmark" size={44} color="#FFF" />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={styles.eyebrowSuccess}>EMAIL SENT</Text>
                  <Text style={styles.successTitle}>Check your inbox</Text>
                  <Text style={styles.successText}>
                    We've sent a password reset link to{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>
                  <GradientButton
                    title="Back to Sign In"
                    onPress={() => navigation.goBack()}
                    variant="accent"
                    style={styles.backToLoginBtn}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setSent(false);
                      checkAnim.setValue(0);
                    }}
                    style={styles.resendBtn}
                  >
                    <Text style={styles.resendText}>
                      Didn't get it?{' '}
                      <Text style={styles.resendLink}>Try a different email</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.header}>
                    <View style={styles.iconRingWrap}>
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconRing}
                      >
                        <View style={styles.iconInner}>
                          <Ionicons name="key-outline" size={32} color={COLORS.primary} />
                        </View>
                      </LinearGradient>
                    </View>

                    <Text style={styles.eyebrow}>FORGOT PASSWORD</Text>
                    <Text style={styles.title}>Reset your password</Text>
                    <Text style={styles.subtitle}>
                      Enter the email tied to your account and we'll send you a secure link to reset it.
                    </Text>
                  </View>

                  <LinearGradient
                    colors={['rgba(108,99,255,0.5)', 'rgba(0,217,166,0.25)', 'rgba(108,99,255,0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardBorder}
                  >
                    <View style={styles.form}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View
                          style={[
                            styles.inputContainer,
                            focused && styles.inputFocused,
                            error && styles.inputError,
                          ]}
                        >
                          <Ionicons
                            name="mail-outline"
                            size={18}
                            color={focused ? COLORS.primary : COLORS.textMuted}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor={COLORS.textMuted}
                            value={email}
                            onChangeText={(t) => {
                              setEmail(t);
                              setError('');
                            }}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                          />
                        </View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                      </View>

                      <GradientButton
                        title="Send Reset Link"
                        onPress={handleReset}
                        loading={loading}
                        style={styles.submitBtn}
                      />

                      <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.rememberedBtn}
                      >
                        <Text style={styles.rememberedText}>
                          Remembered it?{' '}
                          <Text style={styles.rememberedLink}>Sign in</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: 'center',
  },

  blob: {
    position: 'absolute',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
  },
  blobPrimary: {
    backgroundColor: COLORS.primary,
    top: -SCREEN_W * 0.4,
    right: -SCREEN_W * 0.3,
    opacity: 0.28,
  },
  blobAccent: {
    backgroundColor: COLORS.accent,
    bottom: -SCREEN_W * 0.4,
    left: -SCREEN_W * 0.35,
    opacity: 0.18,
  },
  blobOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 33, 0.55)',
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },

  // Header
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  iconRingWrap: {
    marginBottom: SPACING.md,
    ...SHADOWS.glow,
  },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: 24,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    flex: 1,
    width: '100%',
    borderRadius: 21,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
  },

  // Card
  cardBorder: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 1,
    ...SHADOWS.large,
  },
  form: {
    backgroundColor: 'rgba(22, 33, 62, 0.88)',
    borderRadius: BORDER_RADIUS.xl - 1,
    padding: SPACING.lg,
  },

  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 33, 0.6)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  inputError: { borderColor: COLORS.error },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },

  submitBtn: { marginBottom: SPACING.md },
  rememberedBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  rememberedText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },
  rememberedLink: {
    color: COLORS.accent,
    ...FONTS.semiBold,
  },

  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  checkRing: {
    marginBottom: SPACING.xl,
    ...SHADOWS.glow,
    shadowColor: COLORS.accent,
  },
  checkGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowSuccess: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  successTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  emailHighlight: {
    color: COLORS.accent,
    ...FONTS.semiBold,
  },
  backToLoginBtn: {
    width: '100%',
    minWidth: 260,
  },
  resendBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  resendText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    textAlign: 'center',
  },
  resendLink: {
    color: COLORS.primary,
    ...FONTS.semiBold,
  },
});

export default ForgotPasswordScreen;
