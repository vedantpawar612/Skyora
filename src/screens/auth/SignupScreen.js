// Signup Screen - Premium dark themed registration
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
import firestoreService from '../../services/firestoreService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_MAX_WIDTH = 460;

const passwordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: COLORS.textMuted };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too weak', color: COLORS.error },
    { label: 'Weak', color: COLORS.error },
    { label: 'Fair', color: COLORS.warning },
    { label: 'Good', color: COLORS.accent },
    { label: 'Strong', color: COLORS.success },
    { label: 'Excellent', color: COLORS.success },
  ];
  return { score, ...levels[score] };
};

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [focused, setFocused] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
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

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (age && (isNaN(age) || parseInt(age) < 5 || parseInt(age) > 120)) {
      newErrors.age = 'Enter a valid age';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, error } = await authService.signUp(email.trim(), password, name.trim());
      if (error) {
        setFormError(error);
      } else if (user) {
        await firestoreService.createUserProfile(user.uid, {
          name: name.trim(),
          email: email.trim(),
          age: age ? parseInt(age) : null,
        });
      }
    } catch (e) {
      setFormError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const renderInput = (label, value, setter, placeholder, icon, options = {}) => {
    const { secure, keyboardType, errorKey, maxLength, showToggle } = options;
    const isFocused = focused === errorKey;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            errors[errorKey] && styles.inputError,
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? COLORS.primary : COLORS.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={(t) => {
              setter(t);
              setErrors((prev) => ({ ...prev, [errorKey]: null }));
              setFormError('');
            }}
            onFocus={() => setFocused(errorKey)}
            onBlur={() => setFocused(null)}
            secureTextEntry={secure && !showPassword}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
            autoCorrect={false}
            maxLength={maxLength}
          />
          {showToggle && (
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
          )}
        </View>
        {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
      </View>
    );
  };

  const strength = passwordStrength(password);
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

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.eyebrow}>JOIN SKYORA</Text>
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>
                  Begin a personalized yoga practice with AI-powered pose guidance.
                </Text>
              </View>

              {/* Form with gradient border */}
              <LinearGradient
                colors={['rgba(108,99,255,0.5)', 'rgba(0,217,166,0.25)', 'rgba(108,99,255,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorder}
              >
                <View style={styles.form}>
                  {renderInput('Full Name', name, setName, 'Enter your name', 'person-outline', { errorKey: 'name' })}
                  {renderInput('Email', email, setEmail, 'your@email.com', 'mail-outline', { keyboardType: 'email-address', errorKey: 'email' })}
                  {renderInput('Age (Optional)', age, setAge, 'Your age', 'calendar-outline', { keyboardType: 'numeric', errorKey: 'age', maxLength: 3 })}
                  {renderInput('Password', password, setPassword, 'Min 6 characters', 'lock-closed-outline', { secure: true, showToggle: true, errorKey: 'password' })}

                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <View style={styles.strengthWrap}>
                      <View style={styles.strengthBars}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <View
                            key={i}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor:
                                  i < strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthLabel, { color: strength.color }]}>
                        {strength.label}
                      </Text>
                    </View>
                  )}

                  {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'Re-enter password', 'shield-checkmark-outline', { secure: true, errorKey: 'confirmPassword' })}

                  {/* Form-level error (Alert.alert is a no-op on web) */}
                  {formError ? (
                    <View style={styles.formError}>
                      <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
                      <Text style={styles.formErrorText}>{formError}</Text>
                    </View>
                  ) : null}

                  <GradientButton
                    title="Create Account"
                    onPress={handleSignup}
                    loading={loading}
                    style={styles.signupBtn}
                  />

                  <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              <Text style={styles.footer}>
                By creating an account you agree to our{' '}
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

  header: { marginBottom: SPACING.lg, alignItems: 'flex-start' },
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
    lineHeight: 20,
  },

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
    height: 50,
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
  eyeBtn: { padding: SPACING.xs },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  formErrorText: {
    flex: 1,
    color: COLORS.error,
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

  strengthWrap: {
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    letterSpacing: 0.3,
  },

  signupBtn: { marginTop: SPACING.sm, marginBottom: SPACING.lg },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  loginLink: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },

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

export default SignupScreen;
