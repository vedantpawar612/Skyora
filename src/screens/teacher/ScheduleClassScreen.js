// Schedule Class Screen — Schedule a live yoga class
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import GradientButton from '../../components/GradientButton';
import liveClassService from '../../services/liveClassService';

const ScheduleClassScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    capacity: '30',
    price: '0',
  });

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.date.trim()) newErrors.date = 'Date is required (YYYY-MM-DD)';
    if (!form.startTime.trim()) newErrors.startTime = 'Start time is required (HH:MM)';
    if (!form.meetingLink.trim()) newErrors.meetingLink = 'Meeting link is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchedule = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const classData = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date),
        startTime: form.startTime.trim(),
        endTime: form.endTime.trim(),
        meetingLink: form.meetingLink.trim(),
        capacity: Number(form.capacity) || 30,
        price: Number(form.price) || 0,
        registeredStudents: [],
        status: 'scheduled',
      };
      const { id, error } = await liveClassService.createLiveClass(user.uid, classData);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Live class scheduled!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong.');
    }
    setLoading(false);
  };

  const renderInput = (label, key, placeholder, options = {}) => {
    const { multiline, keyboardType, icon } = options;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputContainer, multiline && styles.inputMultiline, errors[key] && styles.inputError]}>
          {icon && <Ionicons name={icon} size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />}
          <TextInput
            style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            value={form[key]}
            onChangeText={(t) => updateForm(key, t)}
            multiline={multiline}
            keyboardType={keyboardType || 'default'}
          />
        </View>
        {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Live Class</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
              {renderInput('Class Title', 'title', 'e.g. Morning Vinyasa Flow', { icon: 'text-outline' })}
              {renderInput('Description (Optional)', 'description', 'What will this class cover?', { multiline: true })}

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {renderInput('Date', 'date', 'YYYY-MM-DD', { icon: 'calendar-outline' })}
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderInput('Start Time', 'startTime', 'HH:MM', { icon: 'time-outline' })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput('End Time', 'endTime', 'HH:MM', { icon: 'time-outline' })}
                </View>
              </View>

              {renderInput('Meeting Link', 'meetingLink', 'Zoom/Google Meet URL', { icon: 'link-outline' })}

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderInput('Capacity', 'capacity', '30', { keyboardType: 'numeric', icon: 'people-outline' })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput('Price (₹)', 'price', '0 = Free', { keyboardType: 'numeric', icon: 'cash-outline' })}
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="videocam" size={20} color={COLORS.accent} />
                <Text style={styles.infoText}>
                  Students will see your meeting link when they register. Use Zoom or Google Meet for the best experience.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomBar}>
          <GradientButton
            title="Schedule Class"
            onPress={handleSchedule}
            loading={loading}
            style={{ flex: 1 }}
            icon={<Ionicons name="calendar" size={16} color="#FFF" />}
          />
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
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  formCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, ...SHADOWS.medium,
  },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium, marginBottom: SPACING.xs },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundElevated,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    height: 50, paddingHorizontal: SPACING.md,
  },
  inputMultiline: { height: 90, alignItems: 'flex-start', paddingTop: SPACING.sm },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.regular },
  errorText: { color: COLORS.error, fontSize: FONT_SIZES.xs, marginTop: 4 },
  row: { flexDirection: 'row' },
  infoCard: {
    flexDirection: 'row', backgroundColor: COLORS.accent + '15', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 20 },
  bottomBar: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    paddingBottom: 30, backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder,
  },
});

export default ScheduleClassScreen;
