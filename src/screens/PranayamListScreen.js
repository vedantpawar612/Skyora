import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';
import { PRANAYAM_TECHNIQUES } from '../data/pranayam';

const { width } = Dimensions.get('window');

const PranayamListScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderItem = ({ item, index }) => {
    // Calculate total duration roughly for display
    const totalCycleTime = item.phases.reduce((acc, phase) => acc + phase.duration, 0);
    const estimatedMins = Math.max(1, Math.round((totalCycleTime * item.defaultCycles) / 60));

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30 + index * 10, 0],
            }),
          }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BreathingSession', { technique: item })}
        >
          <LinearGradient
            colors={[COLORS.backgroundCard, 'rgba(30, 36, 60, 0.8)']}
            style={styles.card}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name="leaf" size={24} color={item.color} />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.sanskritName}>{item.sanskritName}</Text>
              
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>~{estimatedMins} min</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="repeat-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.defaultCycles} cycles</Text>
                </View>
              </View>
            </View>

            <View style={styles.playButton}>
              <Ionicons name="play" size={16} color={COLORS.background} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pranayam</Text>
          <Text style={styles.headerSubtitle}>Guided Breathing Exercises</Text>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            Find a comfortable seated position. Follow the expanding circle and voice guide.
          </Text>
        </View>

        {/* List */}
        <FlatList
          data={PRANAYAM_TECHNIQUES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    marginBottom: SPACING.lg,
  },
  bannerIcon: {
    marginRight: SPACING.sm,
  },
  bannerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
    marginBottom: 2,
  },
  sanskritName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.italic,
    marginBottom: SPACING.xs,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 10,
    ...FONTS.medium,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.glow,
  },
});

export default PranayamListScreen;
