// GradientButton Component - Premium styled button with gradient background
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';

const GradientButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'accent' | 'outline' | 'ghost'
  size = 'large', // 'small' | 'medium' | 'large'
  icon = null,
  style = {},
  textStyle = {},
}) => {
  const isDisabled = disabled || loading;

  const getGradientColors = () => {
    switch (variant) {
      case 'accent': return [COLORS.accent, COLORS.accentLight];
      case 'outline': return ['transparent', 'transparent'];
      case 'ghost': return ['transparent', 'transparent'];
      default: return COLORS.gradientPrimary;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small': return { height: 38, paddingHorizontal: SPACING.md, fontSize: FONT_SIZES.sm };
      case 'medium': return { height: 46, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.md };
      default: return { height: 56, paddingHorizontal: SPACING.xl, fontSize: FONT_SIZES.body };
    }
  };

  const sizeConfig = getSize();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          { height: sizeConfig.height, paddingHorizontal: sizeConfig.paddingHorizontal },
          variant === 'outline' && styles.outline,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textPrimary} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                styles.text,
                { fontSize: sizeConfig.fontSize },
                variant === 'ghost' && styles.ghostText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  text: {
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
    letterSpacing: 0.5,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GradientButton;
