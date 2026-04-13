// StatCard Component - Animated stat display card
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';

const StatCard = ({ title, value, icon, iconColor = COLORS.primary, suffix = '', gradient = false }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const CardWrapper = gradient ? LinearGradient : View;
  const wrapperProps = gradient
    ? { colors: COLORS.gradientCard, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : {};

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <CardWrapper {...wrapperProps} style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.value}>
          {value}{suffix}
        </Text>
        <Text style={styles.title}>{title}</Text>
      </CardWrapper>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginBottom: 2,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatCard;
