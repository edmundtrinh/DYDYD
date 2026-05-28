import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/Button';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, typography, spacing, radii } = useTheme();

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(200, [
      // Shield icon entrance
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title entrance
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
      // Subtitle entrance
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Buttons entrance
      Animated.parallel([
        Animated.timing(actionsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(actionsTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    logoScale,
    logoOpacity,
    titleOpacity,
    titleTranslateY,
    subtitleOpacity,
    actionsOpacity,
    actionsTranslateY,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        {/* Animated shield icon */}
        <Animated.View
          style={[
            styles.shieldContainer,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.pill,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.shieldEmoji}>{'\u{1F6E1}\u{FE0F}'}</Text>
        </Animated.View>

        {/* Logo text */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text
            style={[
              styles.logo,
              {
                color: colors.text,
                fontSize: typography.sizeDisplay,
                fontWeight: typography.weightHeavy,
              },
            ]}
          >
            DYDYD
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: titleOpacity }}>
          <Text
            style={[
              styles.tagline,
              {
                color: colors.xp,
                fontSize: typography.sizeBodySm,
                fontWeight: typography.weightSemi,
              },
            ]}
          >
            Did You Do Your Dailies?
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                fontSize: typography.sizeBodySm + 1,
              },
            ]}
          >
            Turn daily habits into quests.{'\n'}Earn XP. Level up your life.
          </Text>
        </Animated.View>
      </View>

      {/* Action buttons */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: actionsOpacity,
            transform: [{ translateY: actionsTranslateY }],
            gap: spacing.md,
            paddingBottom: spacing['5xl'],
          },
        ]}
      >
        <Button
          title="Begin Your Journey"
          onPress={() => navigation.navigate('Register')}
          variant="primary"
          fullWidth
        />
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          fullWidth
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2EA043',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  shieldEmoji: {
    fontSize: 56,
  },
  logo: {
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  actions: {},
});
