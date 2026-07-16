import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAppDispatch } from '../../store/hooks';
import { setOnboarded } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const OnboardingCompleteScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { colors, typography, spacing, radii } = useTheme();
  const reduceMotion = useReducedMotion();

  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef(new Animated.Value(20)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  // Celebration confetti-like shimmer effect
  const shimmer1 = useRef(new Animated.Value(0)).current;
  const shimmer2 = useRef(new Animated.Value(0)).current;
  const shimmer3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      // Skip all animations — set final values immediately
      iconScale.setValue(1);
      iconOpacity.setValue(1);
      titleOpacity.setValue(1);
      titleTranslateY.setValue(0);
      subtitleOpacity.setValue(1);
      statsOpacity.setValue(1);
      statsTranslateY.setValue(0);
      ctaOpacity.setValue(1);
      // Static shimmer: show particles at half opacity, no animation
      shimmer1.setValue(0.5);
      shimmer2.setValue(0.5);
      shimmer3.setValue(0.5);
      return;
    }

    // Main entrance sequence
    Animated.stagger(180, [
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(statsTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animations (looping) — only when reduced motion is off
    const createShimmer = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );

    createShimmer(shimmer1, 0).start();
    createShimmer(shimmer2, 500).start();
    createShimmer(shimmer3, 1000).start();
  }, [
    reduceMotion,
    iconScale, iconOpacity, titleOpacity, titleTranslateY,
    subtitleOpacity, statsOpacity, statsTranslateY, ctaOpacity,
    shimmer1, shimmer2, shimmer3,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        {/* Floating celebration particles (decorative) */}
        <Animated.Text
          style={[
            styles.particle,
            styles.particle1,
            { opacity: shimmer1 },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          {'\u{2728}'}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.particle,
            styles.particle2,
            { opacity: shimmer2 },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          {'\u{2B50}'}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.particle,
            styles.particle3,
            { opacity: shimmer3 },
          ]}
          accessible={false}
          importantForAccessibility="no"
        >
          {'\u{1F389}'}
        </Animated.Text>

        {/* Main icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.pill,
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <Text style={styles.mainEmoji} accessible={false}>{'\u{2694}\u{FE0F}'}</Text>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text
            style={{
              fontSize: typography.sizeH2 + 4,
              fontWeight: typography.weightHeavy,
              color: colors.text,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            {"You're ready, Adventurer"}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text
            style={{
              fontSize: typography.sizeBodySm + 1,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              marginTop: spacing.md,
              paddingHorizontal: spacing.lg,
            }}
          >
            Your quests are set. Your journey begins now.{'\n'}Go earn some XP.
          </Text>
        </Animated.View>

        {/* Summary stats */}
        <Animated.View
          style={[
            styles.statsRow,
            {
              opacity: statsOpacity,
              transform: [{ translateY: statsTranslateY }],
              marginTop: spacing['2xl'],
              gap: spacing.base,
            },
          ]}
        >
          <View
            style={[
              styles.statPill,
              {
                backgroundColor: colors.surface1,
                borderColor: colors.primary,
                borderRadius: radii.lg,
                padding: spacing.base,
              },
            ]}
            accessible
            accessibilityLabel="Starting level: Level 1"
          >
            <Text style={styles.statEmoji} accessible={false}>{'\u{1F6E1}\u{FE0F}'}</Text>
            <Text
              style={{
                color: colors.primaryBright,
                fontSize: typography.sizeH3,
                fontWeight: typography.weightHeavy,
              }}
            >
              Lv 1
            </Text>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: typography.sizeMicro,
                fontWeight: typography.weightSemi,
              }}
            >
              Starting Level
            </Text>
          </View>

          <View
            style={[
              styles.statPill,
              {
                backgroundColor: colors.surface1,
                borderColor: colors.xp,
                borderRadius: radii.lg,
                padding: spacing.base,
              },
            ]}
            accessible
            accessibilityLabel="Total XP: 0"
          >
            <Text style={styles.statEmoji} accessible={false}>{'\u{2B50}'}</Text>
            <Text
              style={{
                color: colors.goldBright,
                fontSize: typography.sizeH3,
                fontWeight: typography.weightHeavy,
              }}
            >
              0 XP
            </Text>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: typography.sizeMicro,
                fontWeight: typography.weightSemi,
              }}
            >
              Total XP
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View
        style={{
          opacity: ctaOpacity,
          marginBottom: spacing['5xl'],
          paddingHorizontal: spacing.lg,
        }}
      >
        <Button
          title="Begin Your Journey"
          onPress={() => dispatch(setOnboarded(true))}
          fullWidth
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2EA043',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  mainEmoji: {
    fontSize: 48,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
  particle1: {
    top: '15%',
    left: '15%',
  },
  particle2: {
    top: '20%',
    right: '15%',
  },
  particle3: {
    top: '35%',
    left: '25%',
  },
  statsRow: {
    flexDirection: 'row',
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
});
