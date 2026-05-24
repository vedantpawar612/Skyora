// PoseCard Component - Yoga pose list/grid item with glassmorphic design
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';
import { getDifficultyColor } from '../data/poses';

const { width } = Dimensions.get('window');
const cardWidth = (width - SPACING.lg * 3) / 2;

const PoseCard = ({ pose, onPress, variant = 'grid' }) => {
  const difficultyColor = getDifficultyColor(pose.level);

  if (variant === 'list') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.listCard}>
        <Image source={{ uri: pose.thumbnailUrl }} style={styles.listImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.listImageOverlay}
        />
        <View style={styles.listContent}>
          <View style={styles.listInfo}>
            <Text style={styles.listTitle} numberOfLines={1}>{pose.name}</Text>
            <Text style={styles.listSubtitle} numberOfLines={1}>{pose.sanskritName}</Text>
            <View style={styles.listMeta}>
              <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
                <Text style={[styles.difficultyText, { color: difficultyColor }]}>{pose.level}</Text>
              </View>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.durationText}>{pose.duration}s</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.gridCard, { width: cardWidth }]}>
      <Image source={{ uri: pose.thumbnailUrl }} style={styles.gridImage} />
      <LinearGradient
        colors={['transparent', 'rgba(10, 14, 33, 0.95)']}
        style={styles.gridOverlay}
      >
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20', position: 'absolute', top: 8, right: 8 }]}>
          <Text style={[styles.difficultyText, { color: difficultyColor, fontSize: 9 }]}>{pose.level}</Text>
        </View>
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>{pose.name}</Text>
          <Text style={styles.gridSubtitle} numberOfLines={1}>{pose.sanskritName}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid variant
  gridCard: {
    height: cardWidth * 1.3,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.small,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  },
  gridInfo: {
    paddingTop: SPACING.xs,
  },
  gridTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
  gridSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 2,
  },

  // List variant
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    height: 100,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  listImage: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },
  listImageOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100,
    height: '100%',
  },
  listContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
  },
  listSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginTop: 2,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },

  // Shared
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
  },
});

export default PoseCard;
