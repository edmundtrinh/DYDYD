import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface QuestCompletionOverlayProps {
  visible: boolean;
  xpEarned: number;
  questName: string;
  onDismiss: () => void;
}

const ANIMATION_DURATION = 2000;

export const QuestCompletionOverlay: React.FC<QuestCompletionOverlayProps> = ({
  visible,
  xpEarned,
  questName,
  onDismiss,
}) => {
  const { colors, typography, spacing } = useTheme();
  const reduceMotion = useReducedMotion();

  const overlayOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);
  const xpOpacity = useSharedValue(0);
  const xpScale = useSharedValue(0.5);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = 0;
      checkScale.value = 0;
      xpTranslateY.value = 0;
      xpOpacity.value = 0;
      xpScale.value = 0.5;
      return;
    }

    if (reduceMotion) {
      overlayOpacity.value = 1;
      checkScale.value = 1;
      xpOpacity.value = 1;
      xpTranslateY.value = -40;
      xpScale.value = 1;
    } else {
      overlayOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(ANIMATION_DURATION - 400, withTiming(0, { duration: 200 })),
      );

      checkScale.value = withSequence(
        withDelay(100, withSpring(1.2, { damping: 8, stiffness: 200 })),
        withSpring(1, { damping: 12 }),
      );

      xpOpacity.value = withSequence(
        withDelay(300, withTiming(1, { duration: 200 })),
        withDelay(ANIMATION_DURATION - 700, withTiming(0, { duration: 200 })),
      );
      xpTranslateY.value = withDelay(
        300,
        withTiming(-40, { duration: ANIMATION_DURATION - 500, easing: Easing.out(Easing.quad) }),
      );
      xpScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 150 }));
    }

    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility(`Quest complete! ${questName}. Earned ${xpEarned} XP`);

    const timer = setTimeout(() => {
      runOnJS(dismiss)();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [visible, reduceMotion, questName, xpEarned, overlayOpacity, checkScale, xpTranslateY, xpOpacity, xpScale, dismiss]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [
      { translateY: xpTranslateY.value },
      { scale: xpScale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.checkCircle,
            { backgroundColor: colors.primary },
            checkStyle,
          ]}
        >
          <Text style={styles.checkmark}>{'\u{2713}'}</Text>
        </Animated.View>

        <Animated.View style={[styles.xpContainer, xpStyle]}>
          <Text
            style={[
              styles.xpText,
              {
                color: colors.xp,
                fontSize: typography.sizeH2,
                fontWeight: typography.weightHeavy,
              },
            ]}
          >
            +{xpEarned} XP
          </Text>
        </Animated.View>

        <Text
          style={[
            styles.questName,
            {
              color: colors.textSecondary,
              fontSize: typography.sizeBodySm,
              fontWeight: typography.weightMedium,
              marginTop: spacing.sm,
            },
          ]}
        >
          {questName}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 7, 13, 0.6)',
    zIndex: 10000,
  },
  content: {
    alignItems: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  xpContainer: {
    marginTop: 16,
  },
  xpText: {
    letterSpacing: 1,
    textShadowColor: 'rgba(245, 180, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  questName: {
    textAlign: 'center',
    maxWidth: 200,
  },
});
