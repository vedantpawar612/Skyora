// Login Screen - Premium dark themed authentication
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Animated, StatusBar, Dimensions, Image, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import GradientButton from '../../components/GradientButton';
import authService from '../../services/authService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_MAX_WIDTH = 460;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null); // { type: 'error' | 'info', text }
  const [focused, setFocused] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
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

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setFormMessage(null);
    try {
      const { error } = await authService.signIn(email.trim(), password);
      if (error) setFormMessage({ type: 'error', text: error });
    } catch (e) {
      setFormMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
    setLoading(false);
  };

  const handleSocial = (provider) => {
    setFormMessage({ type: 'info', text: `${provider} Sign-In is coming soon.` });
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    setFormMessage(null);
    try {
      const { error } = await authService.signInAsGuest();
      if (error) setFormMessage({ type: 'error', text: error });
    } catch (e) {
      setFormMessage({ type: 'error', text: 'Could not start a guest session.' });
    }
    setGuestLoading(false);
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
      <LinearGradient
        colors={['#05081A', COLORS.background, '#0F1437']}
        style={styles.gradient}
      >
        {/* Animated aurora blobs */}
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
              {/* Header */}
              <View style={styles.header}>
                <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoRing}
                  >
                    <View style={styles.logoInner}>
                      <Image
                        source={require('../../../assets/skyora.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                    </View>
                  </LinearGradient>
                </Animated.View>

                <Text style={styles.eyebrow}>WELCOME BACK</Text>
                <Text style={styles.title}>Sign in to Skyora</Text>
                <Text style={styles.subtitle}>
                  Continue your mindful journey with AI-guided sessions.
                </Text>
              </View>

              {/* Form card with gradient border */}
              <LinearGradient
                colors={['rgba(108,99,255,0.5)', 'rgba(0,217,166,0.25)', 'rgba(108,99,255,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorder}
              >
                <View style={styles.form}>
                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        focused === 'email' && styles.inputFocused,
                        errors.email && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={focused === 'email' ? COLORS.primary : COLORS.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor={COLORS.textMuted}
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          setErrors((prev) => ({ ...prev, email: null }));
                          setFormMessage(null);
                        }}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        focused === 'password' && styles.inputFocused,
                        errors.password && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={focused === 'password' ? COLORS.primary : COLORS.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          setErrors((prev) => ({ ...prev, password: null }));
                          setFormMessage(null);
                        }}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={COLORS.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                  </View>

                  {/* Remember + Forgot row */}
                  <View style={styles.metaRow}>
                    <TouchableOpacity
                      style={styles.rememberRow}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && (
                          <Ionicons name="checkmark" size={12} color={COLORS.textPrimary} />
                        )}
                      </View>
                      <Text style={styles.rememberText}>Remember me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Form-level message (Alert.alert is a no-op on web) */}
                  {formMessage && (
                    <View
                      style={[
                        styles.formMessage,
                        formMessage.type === 'error' ? styles.formMessageError : styles.formMessageInfo,
                      ]}
                    >
                      <Ionicons
                        name={formMessage.type === 'error' ? 'alert-circle-outline' : 'information-circle-outline'}
                        size={16}
                        color={formMessage.type === 'error' ? COLORS.error : COLORS.accent}
                      />
                      <Text
                        style={[
                          styles.formMessageText,
                          { color: formMessage.type === 'error' ? COLORS.error : COLORS.accent },
                        ]}
                      >
                        {formMessage.text}
                      </Text>
                    </View>
                  )}

                  {/* Sign In */}
                  <GradientButton
                    title="Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.loginBtn}
                  />

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social */}
                  <View style={styles.socialRow}>
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => handleSocial('Google')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-google" size={20} color="#EA4335" />
                      <Text style={styles.socialText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => handleSocial('Apple')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-apple" size={22} color={COLORS.textPrimary} />
                      <Text style={styles.socialText}>Apple</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Guest */}
                  <GradientButton
                    title={guestLoading ? 'Starting…' : 'Try it as a guest'}
                    onPress={handleGuest}
                    variant="outline"
                    disabled={guestLoading}
                    icon={<Ionicons name="flash-outline" size={18} color={COLORS.primary} />}
                    style={styles.guestBtn}
                  />

                  {/* Sign Up */}
                  <View style={styles.signupRow}>
                    <Text style={styles.signupText}>New to Skyora? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                      <Text style={styles.signupLink}>Create an account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              {/* Footer */}
              <Text style={styles.footer}>
                By signing in you agree to our{' '}
                <Text style={styles.footerLink}>Terms</Text> &{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>.
              </Text>
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

  // Aurora blobs
  blob: {
    position: 'absolute',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
    opacity: 0.55,
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoWrap: {
    marginBottom: SPACING.md,
    ...SHADOWS.glow,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  logoInner: {
    flex: 1,
    width: '100%',
    borderRadius: 21,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
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
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
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

  // Inputs
  inputGroup: { marginBottom: SPACING.md },
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
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  eyeBtn: { padding: SPACING.xs },
  formMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  formMessageError: {
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
  },
  formMessageInfo: {
    borderColor: 'rgba(0, 217, 166, 0.4)',
    backgroundColor: 'rgba(0, 217, 166, 0.08)',
  },
  formMessageText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },

  loginBtn: { marginBottom: SPACING.lg },
  guestBtn: { marginTop: SPACING.md },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    ...FONTS.semiBold,
    marginHorizontal: SPACING.md,
    letterSpacing: 1.5,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  socialText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
    marginLeft: SPACING.sm,
  },

  // Sign up
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  signupLink: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },

  // Footer
  footer: {
    marginTop: SPACING.lg,
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    ...FONTS.regular,
    lineHeight: 16,
  },
  footerLink: {
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
});

export default LoginScreen;
