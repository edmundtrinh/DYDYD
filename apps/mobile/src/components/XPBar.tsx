import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface XPBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  height?: number;
  showLabel?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  requiredXP,
  level,
  height = 8,
  showLabel = true,
}) => {
  const { colors, radii, typography, spacing } = useTheme();
  const progress = requiredXP > 0 ? Math.min(currentXP / requiredXP, 1) : 0;
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      {showLabel && (
        <View style={[styles.labelRow, { marginBottom: spacing.xs }]}>
          <Text
            style={{
              color: colors.primaryBright,
              fontSize: typography.sizeMicro,
              fontWeight: typography.weightSemi,
            }}
          >
            Lv {level}
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typography.sizeMicro,
              fontWeight: typography.weightMedium,
            }}
          >
            {currentXP} / {requiredXP} XP
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.surface3,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              backgroundColor: colors.primary,
              borderRadius: height / 2,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text
          style={[
            styles.remaining,
            {
              color: colors.textTertiary,
              fontSize: typography.sizeMicro,
              marginTop: spacing.xs,
            },
          ]}
        >
          {Math.max(0, requiredXP - currentXP)} XP to Level {level + 1}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  remaining: {
    textAlign: 'center',
  },
});
