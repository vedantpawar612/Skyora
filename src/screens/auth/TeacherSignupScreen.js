// TeacherSignupScreen - Multi-step teacher registration form
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Animated, StatusBar, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const SPECIALIZATIONS = ['Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Meditation'];

const TOTAL_STEPS = 3;

const TeacherSignupScreen = ({ navigation }) => {
  const { signUpTeacher } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 - Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 - Professional Info
  const [bio, setBio] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [yearsExperience, setYearsExperience] = useState('');

  // Step 3 - Credentials
  const [certifications, setCertifications] = useState([]);
  const [currentCert, setCurrentCert] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(stepAnim, {
      toValue: currentStep,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const toggleSpecialization = (spec) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
    setErrors((prev) => ({ ...prev, specialization: null }));
  };

  const addCertification = () => {
    const trimmed = currentCert.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed]);
      setCurrentCert('');
    }
  };

  const removeCertification = (cert) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  // Validation per step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
      if (!mobile.trim()) newErrors.mobile = 'Mobile number is required';
      else if (mobile.trim().length < 10) newErrors.mobile = 'Enter a valid mobile number';
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 2) {
      if (!bio.trim()) newErrors.bio = 'Bio is required';
      else if (bio.trim().length < 20) newErrors.bio = 'Bio should be at least 20 characters';
      if (selectedSpecializations.length === 0) newErrors.specialization = 'Select at least one specialization';
      if (!yearsExperience.trim()) newErrors.yearsExperience = 'Years of experience is required';
      else if (isNaN(Number(yearsExperience)) || Number(yearsExperience) < 0) newErrors.yearsExperience = 'Enter a valid number';
    }

    if (step === 3) {
      if (!agreedTerms) newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleRegister = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const teacherData = {
        name: fullName.trim(),
        mobile: mobile.trim(),
        bio: bio.trim(),
        specialization: selectedSpecializations,
        yearsOfExperience: Number(yearsExperience),
        certifications,
        profilePhoto: '',
      };

      const { error } = await signUpTeacher(email.trim(), password, teacherData);
      if (error) {
        Alert.alert('Registration Failed', error);
      }
      // On success, navigation is handled by AuthContext (auto-routes to teacher dashboard)
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const renderInput = ({ label, icon, value, onChangeText, placeholder, errorKey, keyboardType, secureTextEntry, showToggle, toggleValue, onToggle, multiline, numberOfLines }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputContainer,
        multiline && styles.inputMultiline,
        errors[errorKey] && styles.inputError,
      ]}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.inputMultilineText]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={(t) => { onChangeText(t); clearError(errorKey); }}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry && !toggleValue}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <Ionicons name={toggleValue ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
    </View>
  );

  // Step 1 - Basic Info
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Let's start with your personal details</Text>

      {renderInput({
        label: 'Full Name', icon: 'person-outline', value: fullName, onChangeText: setFullName,
        placeholder: 'Enter your full name', errorKey: 'fullName',
      })}
      {renderInput({
        label: 'Email', icon: 'mail-outline', value: email, onChangeText: setEmail,
        placeholder: 'your@email.com', errorKey: 'email', keyboardType: 'email-address',
      })}
      {renderInput({
        label: 'Mobile Number', icon: 'call-outline', value: mobile, onChangeText: setMobile,
        placeholder: '+91 XXXXX XXXXX', errorKey: 'mobile', keyboardType: 'phone-pad',
      })}
      {renderInput({
        label: 'Password', icon: 'lock-closed-outline', value: password, onChangeText: setPassword,
        placeholder: 'Create a password', errorKey: 'password', secureTextEntry: true,
        showToggle: true, toggleValue: showPassword, onToggle: () => setShowPassword(!showPassword),
      })}
      {renderInput({
        label: 'Confirm Password', icon: 'lock-closed-outline', value: confirmPassword, onChangeText: setConfirmPassword,
        placeholder: 'Confirm your password', errorKey: 'confirmPassword', secureTextEntry: true,
        showToggle: true, toggleValue: showConfirmPassword, onToggle: () => setShowConfirmPassword(!showConfirmPassword),
      })}
    </View>
  );

  // Step 2 - Professional Info
  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Professional Info</Text>
      <Text style={styles.stepSubtitle}>Tell us about your teaching experience</Text>

      {renderInput({
        label: 'Bio', icon: 'document-text-outline', value: bio, onChangeText: setBio,
        placeholder: 'Tell students about yourself, your teaching style, and philosophy...',
        errorKey: 'bio', multiline: true, numberOfLines: 4,
      })}

      {/* Specialization Chips */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Specialization</Text>
        <View style={styles.chipContainer}>
          {SPECIALIZATIONS.map((spec) => {
            const isSelected = selectedSpecializations.includes(spec);
            return (
              <TouchableOpacity
                key={spec}
                style={[styles.chip, isSelected && styles.chipSelected]}
                activeOpacity={0.7}
                onPress={() => toggleSpecialization(spec)}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{spec}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}
      </View>

      {renderInput({
        label: 'Years of Experience', icon: 'time-outline', value: yearsExperience, onChangeText: setYearsExperience,
        placeholder: 'e.g. 5', errorKey: 'yearsExperience', keyboardType: 'numeric',
      })}
    </View>
  );

  // Step 3 - Credentials
  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Credentials</Text>
      <Text style={styles.stepSubtitle}>Add your certifications and complete registration</Text>

      {/* Certifications */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Certifications</Text>
        <View style={styles.certInputRow}>
          <View style={[styles.inputContainer, styles.certInput]}>
            <Ionicons name="ribbon-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. RYT 200, YTT Certification"
              placeholderTextColor={COLORS.textMuted}
              value={currentCert}
              onChangeText={setCurrentCert}
              onSubmitEditing={addCertification}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            style={styles.addCertBtn}
            activeOpacity={0.7}
            onPress={addCertification}
          >
            <LinearGradient colors={COLORS.gradientAccent} style={styles.addCertBtnGradient}>
              <Ionicons name="add" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Cert List */}
        {certifications.length > 0 && (
          <View style={styles.certList}>
            {certifications.map((cert, idx) => (
              <View key={idx} style={styles.certItem}>
                <Ionicons name="ribbon" size={14} color={COLORS.accent} />
                <Text style={styles.certItemText} numberOfLines={1}>{cert}</Text>
                <TouchableOpacity onPress={() => removeCertification(cert)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Profile Photo Placeholder */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Profile Photo</Text>
        <TouchableOpacity
          style={styles.photoPlaceholder}
          activeOpacity={0.7}
        >
          <View style={styles.photoCircle}>
            <Ionicons name="camera" size={32} color={COLORS.textMuted} />
          </View>
          <Text style={styles.photoText}>Tap to upload photo</Text>
          <Text style={styles.photoSubtext}>Optional — you can add this later</Text>
        </TouchableOpacity>
      </View>

      {/* Terms Checkbox */}
      <TouchableOpacity
        style={styles.termsRow}
        activeOpacity={0.7}
        onPress={() => { setAgreedTerms(!agreedTerms); clearError('terms'); }}
      >
        <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
          {agreedTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
      {errors.terms && <Text style={[styles.errorText, { marginTop: -8, marginBottom: SPACING.md }]}>{errors.terms}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        {/* Decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

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
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Teach on Skyora</Text>
                <Text style={styles.headerSubtitle}>Create your teacher account</Text>
              </View>

              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                {[1, 2, 3].map((step) => (
                  <View key={step} style={styles.stepDotRow}>
                    <View style={[
                      styles.stepDot,
                      currentStep >= step && styles.stepDotActive,
                      currentStep === step && styles.stepDotCurrent,
                    ]}>
                      {currentStep > step ? (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      ) : (
                        <Text style={[styles.stepDotText, currentStep >= step && styles.stepDotTextActive]}>
                          {step}
                        </Text>
                      )}
                    </View>
                    {step < 3 && (
                      <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
                    )}
                  </View>
                ))}
              </View>

              {/* Step Labels */}
              <View style={styles.stepLabels}>
                <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Basic</Text>
                <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Professional</Text>
                <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>Credentials</Text>
              </View>

              {/* Form Card */}
              <View style={styles.form}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                {/* Navigation Buttons */}
                <View style={styles.navBtns}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={styles.backBtn}
                      activeOpacity={0.7}
                      onPress={handleBack}
                    >
                      <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1 }} />
                  {currentStep < TOTAL_STEPS ? (
                    <GradientButton
                      title="Next"
                      onPress={handleNext}
                      size="medium"
                      icon={<Ionicons name="arrow-forward" size={16} color="#FFF" />}
                      style={styles.nextBtn}
                    />
                  ) : (
                    <GradientButton
                      title="Register"
                      onPress={handleRegister}
                      loading={loading}
                      variant="accent"
                      size="medium"
                      icon={<Ionicons name="checkmark-circle" size={16} color="#FFF" />}
                      style={styles.nextBtn}
                    />
                  )}
                </View>
              </View>

              {/* Footer Links */}
              <View style={styles.footerLinks}>
                <View style={styles.signupRow}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.signupRow, { marginTop: SPACING.sm }]}>
                  <Text style={styles.footerText}>Register as Student instead? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate(ROUTES.SIGNUP)}>
                    <Text style={styles.footerLinkAccent}>Student Signup</Text>
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
    paddingVertical: SPACING.xxl,
    paddingTop: 60,
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
  decorCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(0, 217, 166, 0.03)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepDotCurrent: {
    ...SHADOWS.glow,
  },
  stepDotText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
  },
  stepDotTextActive: {
    color: COLORS.textPrimary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: SPACING.xs,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  // Step Labels
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  stepLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  // Form
  form: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    marginBottom: SPACING.lg,
  },
  // Input
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
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  inputMultiline: {
    height: 110,
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
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
  },
  inputMultilineText: {
    height: 90,
    textAlignVertical: 'top',
  },
  eyeBtn: { padding: SPACING.xs },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },
  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  chipSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  chipTextSelected: {
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
  },
  // Certifications
  certInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certInput: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  addCertBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  addCertBtnGradient: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certList: {
    marginTop: SPACING.sm,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  certItemText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    marginLeft: SPACING.sm,
  },
  // Photo
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
    paddingVertical: SPACING.lg,
  },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
  },
  photoText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
  },
  photoSubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 4,
  },
  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    ...FONTS.medium,
  },
  // Navigation Buttons
  navBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
    marginLeft: SPACING.xs,
  },
  nextBtn: {
    minWidth: 130,
  },
  // Footer
  footerLinks: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  footerLink: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
  footerLinkAccent: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
});

export default TeacherSignupScreen;
