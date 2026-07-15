import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { getLevelTitle } from '@dydyd/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface LevelUpOverlayProps {
  visible: boolean;
  newLevel: number;
  onDismiss: () => void;
}

const ANIMATION_DURATION = 3500;

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({
  visible,
  newLevel,
  onDismiss,
}) => {
  const { colors, typography, spacing } = useTheme();
  const reduceMotion = useReducedMotion();

  const overlayOpacity = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const sparkleOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = 0;
      levelScale.value = 0;
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      sparkleOpacity.value = 0;
      return;
    }

    if (reduceMotion) {
      overlayOpacity.value = 1;
      levelScale.value = 1;
      sparkleOpacity.value = 1;
      titleOpacity.value = 1;
      titleTranslateY.value = 0;
    } else {
      overlayOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(ANIMATION_DURATION - 600, withTiming(0, { duration: 300 })),
      );

      levelScale.value = withSequence(
        withDelay(200, withSpring(1.4, { damping: 5, stiffness: 120 })),
        withSpring(1, { damping: 8 }),
      );

      sparkleOpacity.value = withSequence(
        withDelay(300, withTiming(1, { duration: 300 })),
        withDelay(ANIMATION_DURATION - 900, withTiming(0, { duration: 300 })),
      );

      titleOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
      titleTranslateY.value = withDelay(600, withSpring(0, { damping: 12 }));
    }

    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility(`Level up! You are now level ${newLevel}, ${getLevelTitle(newLevel)}`);

    const timer = setTimeout(() => {
      runOnJS(dismiss)();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [visible, reduceMotion, newLevel, overlayOpacity, levelScale, titleOpacity, titleTranslateY, sparkleOpacity, dismiss]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  if (!visible) return null;

  const levelTitle = getLevelTitle(newLevel);

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <TouchableOpacity
        style={styles.dismissArea}
        onPress={dismiss}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Level up! Level ${newLevel}, ${levelTitle}. Tap to dismiss`}
      >
        <Animated.View style={sparkleStyle}>
          <Text style={styles.sparkles}>{'\u{2728}'}</Text>
        </Animated.View>

        <Text style={[styles.levelUpLabel, { color: colors.xp, fontSize: typography.sizeCaption, fontWeight: typography.weightBold }]}>
          LEVEL UP!
        </Text>

        <Animated.View style={levelStyle}>
          <View style={[styles.levelCircle, { borderColor: colors.xp }]}>
            <Text style={[styles.levelNumber, { color: colors.xp, fontSize: typography.sizeDisplay, fontWeight: typography.weightHeavy }]}>
              {newLevel}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={[styles.titleText, { color: colors.text, fontSize: typography.sizeH3, fontWeight: typography.weightBold }]}>
            {levelTitle}
          </Text>
        </Animated.View>

        <Text style={[styles.tapHint, { color: colors.textTertiary, fontSize: typography.sizeMicro }]}>
          Tap to continue
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 7, 13, 0.9)',
    zIndex: 10002,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  sparkles: {
    fontSize: 48,
    marginBottom: 16,
  },
  levelUpLabel: {
    letterSpacing: 4,
    marginBottom: 16,
  },
  levelCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelNumber: {
    textShadowColor: 'rgba(245, 180, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  titleText: {
    textAlign: 'center',
  },
  tapHint: {
    position: 'absolute',
    bottom: 60,
  },
});
