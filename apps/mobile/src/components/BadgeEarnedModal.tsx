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
import { useTheme } from '../theme/ThemeProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectNewBadgeIds, selectEarnedBadges, clearNewBadges } from '../store/slices/progressSlice';
import { PREDEFINED_BADGES } from '@dydyd/shared';

type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_GLOW_COLORS: Record<string, string> = {
  common: 'rgba(156, 163, 175, 0.4)',
  rare: 'rgba(37, 99, 235, 0.4)',
  epic: 'rgba(124, 58, 237, 0.4)',
  legendary: 'rgba(245, 180, 0, 0.5)',
};

export const BadgeEarnedModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { colors, typography, spacing, radii } = useTheme();
  const reduceMotion = useReducedMotion();
  const newBadgeIds = useAppSelector(selectNewBadgeIds);
  const earnedBadges = useAppSelector(selectEarnedBadges);

  const overlayOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const currentBadgeId = newBadgeIds[0];
  const earnedBadge = earnedBadges.find((b) => b.id === currentBadgeId);
  const badgeDef = earnedBadge
    ? PREDEFINED_BADGES.find((b) => b.name === (earnedBadge.badge?.name ?? ''))
    : null;

  const handleDismiss = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    badgeScale.value = withTiming(0, { duration: 200 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      dispatch(clearNewBadges());
    }, 250);
  }, [dispatch, overlayOpacity, badgeScale, glowOpacity]);

  useEffect(() => {
    if (!currentBadgeId || !badgeDef) return;

    if (reduceMotion) {
      overlayOpacity.value = 1;
      badgeScale.value = 1;
      glowOpacity.value = 1;
    } else {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      badgeScale.value = withSequence(
        withDelay(200, withSpring(1.3, { damping: 6, stiffness: 150 })),
        withSpring(1, { damping: 10 }),
      );
      glowOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    }

    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility(
      `Badge earned! ${badgeDef.name}, ${badgeDef.rarity || 'common'} rarity. ${badgeDef.description}`,
    );

    const timer = setTimeout(() => {
      runOnJS(handleDismiss)();
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentBadgeId, badgeDef, reduceMotion, overlayOpacity, badgeScale, glowOpacity, handleDismiss]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!currentBadgeId || !badgeDef) return null;

  const rarity = (badgeDef.rarity || 'common') as BadgeRarity;
  const glowColor = RARITY_GLOW_COLORS[rarity] || RARITY_GLOW_COLORS.common;
  const rarityColorMap: Record<string, string> = {
    common: colors.rarityCommon,
    rare: colors.rarityRare,
    epic: colors.rarityEpic,
    legendary: colors.rarityLegendary,
  };
  const rarityColor = rarityColorMap[rarity] || colors.rarityCommon;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <TouchableOpacity
        style={styles.dismissArea}
        onPress={handleDismiss}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Badge earned: ${badgeDef.name}, ${rarity} rarity. ${badgeDef.description}. Tap to dismiss`}
      >
        <Animated.View style={[styles.glowCircle, { shadowColor: glowColor }, glowStyle]} />

        <Animated.View style={[styles.badgeContainer, badgeStyle]}>
          <View style={[styles.badgeCircle, { backgroundColor: colors.surface2, borderColor: rarityColor }]}>
            <Text style={styles.badgeIcon}>{badgeDef.iconName}</Text>
          </View>
        </Animated.View>

        <Text style={[styles.earnedLabel, { color: rarityColor, fontSize: typography.sizeCaption, fontWeight: typography.weightBold }]}>
          BADGE EARNED
        </Text>

        <Text style={[styles.badgeName, { color: colors.text, fontSize: typography.sizeH3, fontWeight: typography.weightHeavy }]}>
          {badgeDef.name}
        </Text>

        <Text style={[styles.rarityLabel, { color: rarityColor, fontSize: typography.sizeCaption, fontWeight: typography.weightSemi }]}>
          {rarity.toUpperCase()}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary, fontSize: typography.sizeBodySm, fontWeight: typography.weightRegular }]}>
          {badgeDef.description}
        </Text>

        <Text style={[styles.tapHint, { color: colors.textTertiary, fontSize: typography.sizeMicro }]}>
          Tap to dismiss
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 7, 13, 0.85)',
    zIndex: 10001,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 20,
  },
  badgeContainer: {
    marginBottom: 24,
  },
  badgeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 40,
  },
  earnedLabel: {
    letterSpacing: 3,
    marginBottom: 8,
  },
  badgeName: {
    textAlign: 'center',
    marginBottom: 4,
  },
  rarityLabel: {
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
    marginBottom: 32,
  },
  tapHint: {
    position: 'absolute',
    bottom: 60,
  },
});
