// Create Course Screen — Multi-step course creation for teachers
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Alert, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import GradientButton from '../../components/GradientButton';
import courseService from '../../services/courseService';

const { width } = Dimensions.get('window');
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES = ['Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Power', 'Meditation', 'Pranayama', 'Restorative'];

const CreateCourseScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    difficulty: 'Beginner',
    category: 'Hatha',
    duration: '',
    youtubeUrl: '',
    objectives: [],
    newObjective: '',
  });

  const [errors, setErrors] = useState({});

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const animateStep = (next) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 150);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!form.title.trim()) newErrors.title = 'Title is required';
      if (!form.description.trim()) newErrors.description = 'Description is required';
    } else if (step === 1) {
      if (!form.price.trim()) newErrors.price = 'Price is required';
      else if (isNaN(form.price) || Number(form.price) < 0) newErrors.price = 'Enter a valid price';
      if (!form.duration.trim()) newErrors.duration = 'Duration is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) animateStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) animateStep(step - 1);
    else navigation.goBack();
  };

  const addObjective = () => {
    if (form.newObjective.trim()) {
      updateForm('objectives', [...form.objectives, form.newObjective.trim()]);
      updateForm('newObjective', '');
    }
  };

  const removeObjective = (index) => {
    updateForm('objectives', form.objectives.filter((_, i) => i !== index));
  };

  const handleCreateCourse = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const courseData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        difficulty: form.difficulty.toLowerCase(),
        category: form.category,
        duration: form.duration.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        objectives: form.objectives,
        thumbnail: '',
        totalStudents: 0,
        rating: 0,
      };
      const { id, error } = await courseService.createCourse(user.uid, courseData);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Course created successfully! You can now add modules and lessons.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {['Details', 'Pricing', 'Content'].map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            {i < step ? (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            ) : (
              <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{label}</Text>
          {i < 2 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderInput = (label, key, placeholder, options = {}) => {
    const { multiline, keyboardType, maxLength } = options;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputContainer, multiline && styles.inputMultiline, errors[key] && styles.inputError]}>
          <TextInput
            style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            value={form[key]}
            onChangeText={(t) => updateForm(key, t)}
            multiline={multiline}
            keyboardType={keyboardType || 'default'}
            maxLength={maxLength}
          />
        </View>
        {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
      </View>
    );
  };

  const renderStep0 = () => (
    <>
      {renderInput('Course Title', 'title', 'e.g. Morning Yoga Flow', { maxLength: 100 })}
      {renderInput('Description', 'description', 'Describe what students will learn...', { multiline: true })}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => updateForm('category', cat)}
              style={[styles.chip, form.category === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const renderStep1 = () => (
    <>
      {renderInput('Price (₹)', 'price', '0 for free', { keyboardType: 'numeric' })}
      {renderInput('Estimated Duration', 'duration', 'e.g. 4 weeks, 20 hours')}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Difficulty Level</Text>
        <View style={styles.levelRow}>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => updateForm('difficulty', level)}
              style={[styles.levelBtn, form.difficulty === level && styles.levelBtnActive]}
            >
              <Text style={[styles.levelText, form.difficulty === level && styles.levelTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {renderInput('YouTube Introduction Video (Optional)', 'youtubeUrl', 'https://youtube.com/...')}
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Learning Objectives</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, styles.addInput]}
            placeholder="Add an objective..."
            placeholderTextColor={COLORS.textMuted}
            value={form.newObjective}
            onChangeText={(t) => updateForm('newObjective', t)}
          />
          <TouchableOpacity onPress={addObjective} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        {form.objectives.map((obj, i) => (
          <View key={i} style={styles.objectiveItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.objectiveText}>{obj}</Text>
            <TouchableOpacity onPress={() => removeObjective(i)}>
              <Ionicons name="close-circle" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={COLORS.info} />
        <Text style={styles.infoText}>
          After creating the course, you can add modules and lessons with video content.
        </Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Course</Text>
          <View style={{ width: 40 }} />
        </View>

        {renderStepIndicator()}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
              {step === 0 && renderStep0()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          {step > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.secondaryBtn}>
              <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step < 2 ? (
            <GradientButton title="Next" onPress={handleNext} size="medium" icon={<Ionicons name="arrow-forward" size={16} color="#FFF" />} />
          ) : (
            <GradientButton title="Create Course" onPress={handleCreateCourse} loading={loading} size="medium" icon={<Ionicons name="checkmark" size={16} color="#FFF" />} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.bold },
  stepNumActive: { color: '#FFF' },
  stepLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.medium, marginLeft: 4, marginRight: 8 },
  stepLabelActive: { color: COLORS.primary },
  stepLine: { width: 20, height: 2, backgroundColor: COLORS.surfaceBorder, marginRight: 8 },
  stepLineActive: { backgroundColor: COLORS.primary },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  formCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, ...SHADOWS.medium,
  },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium, marginBottom: SPACING.xs },
  inputContainer: {
    backgroundColor: COLORS.backgroundElevated, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, height: 50, paddingHorizontal: SPACING.md, justifyContent: 'center',
  },
  inputMultiline: { height: 110, paddingTop: SPACING.sm },
  inputError: { borderColor: COLORS.error },
  input: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.regular },
  errorText: { color: COLORS.error, fontSize: FONT_SIZES.xs, marginTop: 4 },
  chipScroll: { marginTop: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundElevated, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  chipTextActive: { color: COLORS.primary },
  levelRow: { flexDirection: 'row', gap: SPACING.sm },
  levelBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundElevated, borderWidth: 1, borderColor: COLORS.surfaceBorder, alignItems: 'center',
  },
  levelBtnActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  levelText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  levelTextActive: { color: COLORS.primary },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  addInput: {
    flex: 1, height: 46, backgroundColor: COLORS.backgroundElevated, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, paddingHorizontal: SPACING.md,
  },
  addBtn: {
    width: 46, height: 46, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  objectiveItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md, backgroundColor: COLORS.backgroundElevated, borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm, gap: SPACING.sm,
  },
  objectiveText: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  infoCard: {
    flexDirection: 'row', backgroundColor: COLORS.info + '15', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md,
  },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 20 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, paddingBottom: 30, backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundCard,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, gap: 4,
  },
  secondaryBtnText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, ...FONTS.medium },
});

export default CreateCourseScreen;
