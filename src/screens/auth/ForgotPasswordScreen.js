// Forgot Password Screen
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import GradientButton from '../../components/GradientButton';
import authService from '../../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Back button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {sent ? (
              // Success state
              <View style={styles.successContainer}>
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkAnim }] }]}>
                  <LinearGradient colors={COLORS.gradientAccent} style={styles.checkGradient}>
                    <Ionicons name="checkmark" size={40} color="#FFF" />
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
                <GradientButton
                  title="Back to Login"
                  onPress={() => navigation.goBack()}
                  variant="accent"
                  style={styles.backToLoginBtn}
                />
              </View>
            ) : (
              // Form state
              <>
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="key-outline" size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={[styles.inputContainer, error && styles.inputError]}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor={COLORS.textMuted}
                        value={email}
                        onChangeText={(t) => { setEmail(t); setError(''); }}
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
                  />
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
    justifyContent: 'flex-start',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  iconContainer: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textPrimary, fontSize: FONT_SIZES.xxl,
    ...FONTS.bold, marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textMuted, fontSize: FONT_SIZES.md,
    ...FONTS.regular, textAlign: 'center', lineHeight: 22,
  },
  form: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: {
    color: COLORS.textSecondary, fontSize: FONT_SIZES.sm,
    ...FONTS.medium, marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    height: 52, paddingHorizontal: SPACING.md,
  },
  inputError: { borderColor: COLORS.error },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1, color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body, ...FONTS.regular,
  },
  errorText: {
    color: COLORS.error, fontSize: FONT_SIZES.xs,
    ...FONTS.regular, marginTop: 4, marginLeft: 4,
  },
  // Success state
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 100,
  },
  checkCircle: { marginBottom: SPACING.xl },
  checkGradient: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: {
    color: COLORS.textPrimary, fontSize: FONT_SIZES.xxl,
    ...FONTS.bold, marginBottom: SPACING.sm,
  },
  successText: {
    color: COLORS.textMuted, fontSize: FONT_SIZES.body,
    ...FONTS.regular, textAlign: 'center', lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  emailHighlight: {
    color: COLORS.accent, ...FONTS.semiBold,
  },
  backToLoginBtn: { width: '100%' },
});

export default ForgotPasswordScreen;
