// Signup Screen
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Animated, StatusBar, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import GradientButton from '../../components/GradientButton';
import authService from '../../services/authService';
import firestoreService from '../../services/firestoreService';

const { width } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
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
        Alert.alert('Signup Failed', error);
      } else if (user) {
        // Save user profile to Firestore
        await firestoreService.createUserProfile(user.uid, {
          name: name.trim(),
          email: email.trim(),
          age: age ? parseInt(age) : null,
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const renderInput = (label, value, setter, placeholder, icon, options = {}) => {
    const { secure, keyboardType, errorKey, maxLength } = options;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputContainer, errors[errorKey] && styles.inputError]}>
          <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={(t) => { setter(t); setErrors(prev => ({ ...prev, [errorKey]: null })); }}
            secureTextEntry={secure && !showPassword}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
            maxLength={maxLength}
          />
          {secure && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <View style={styles.decorCircle1} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Back button */}
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Start your AI-powered yoga journey</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {renderInput('Full Name', name, setName, 'Enter your name', 'person-outline', { errorKey: 'name' })}
                {renderInput('Email', email, setEmail, 'your@email.com', 'mail-outline', { keyboardType: 'email-address', errorKey: 'email' })}
                {renderInput('Age (Optional)', age, setAge, 'Your age', 'calendar-outline', { keyboardType: 'numeric', errorKey: 'age', maxLength: 3 })}
                {renderInput('Password', password, setPassword, 'Min 6 characters', 'lock-closed-outline', { secure: true, errorKey: 'password' })}
                {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'Re-enter password', 'shield-checkmark-outline', { secure: true, errorKey: 'confirmPassword' })}

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
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
    paddingBottom: SPACING.xxl,
  },
  decorCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(108, 99, 255, 0.03)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  header: { marginBottom: SPACING.lg },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  form: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    height: 50,
    paddingHorizontal: SPACING.md,
  },
  inputError: { borderColor: COLORS.error },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
  },
  eyeBtn: { padding: SPACING.xs },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
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
});

export default SignupScreen;
