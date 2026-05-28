import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { QuestCategory } from '@dydyd/shared';
import { useTheme } from '../theme/ThemeProvider';
import { getCategoryColor, getCategoryEmoji } from './CategoryIcon';

interface QuestCardProps {
  name: string;
  category: QuestCategory;
  xpReward: number;
  completed?: boolean;
  streak?: number;
  frequency?: string;
  currentValue?: number;
  targetValue?: number;
  onComplete?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  name,
  category,
  xpReward,
  completed = false,
  streak = 0,
  frequency = 'Daily',
  currentValue,
  targetValue,
  onComplete,
  onPress,
  style,
}) => {
  const { colors, radii, typography, spacing } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;

  const catColor = getCategoryColor(category, colors);
  const catEmoji = getCategoryEmoji(category);
  const hasProgress = targetValue != null && targetValue > 1;
  const progress = hasProgress ? Math.min((currentValue || 0) / targetValue, 1) : 0;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !completed && Math.abs(gestureState.dx) > 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60 && onComplete) {
          Animated.timing(translateX, {
            toValue: -100,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onComplete();
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Swipe-behind completion indicator */}
      <View
        style={[
          styles.swipeBehind,
          {
            backgroundColor: colors.primary,
            borderRadius: radii.md,
          },
        ]}
      >
        <Text style={styles.swipeText}>{'✓'} Complete</Text>
      </View>

      <Animated.View
        {...(completed ? {} : panResponder.panHandlers)}
        style={{ transform: [{ translateX }] }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          disabled={!onPress}
          style={[
            styles.container,
            {
              backgroundColor: colors.surface1,
              borderColor: colors.border,
              borderRadius: radii.md,
              opacity: completed ? 0.6 : 1,
            },
          ]}
        >
          {/* Category color stripe */}
          <View
            style={[
              styles.stripe,
              { backgroundColor: catColor },
            ]}
          />

          {/* Category icon */}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: catColor + '33',
                borderRadius: radii.md,
                marginLeft: spacing.sm,
              },
            ]}
          >
            <Text style={styles.iconEmoji}>{catEmoji}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.name,
                {
                  color: completed ? colors.textTertiary : colors.text,
                  fontSize: typography.sizeBodySm + 1,
                  fontWeight: typography.weightSemi,
                  textDecorationLine: completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>

            {hasProgress && (
              <View
                style={[
                  styles.progressTrack,
                  {
                    backgroundColor: colors.surface3,
                    borderRadius: 2,
                    marginTop: 4,
                  },
                ]}
              >
                <View
                  style={{
                    height: 4,
                    width: `${Math.min(progress * 100, 100)}%` as `${number}%`,
                    backgroundColor: catColor,
                    borderRadius: 2,
                  }}
                />
              </View>
            )}

            <Text
              style={{
                color: colors.textTertiary,
                fontSize: typography.sizeMicro,
                marginTop: 4,
              }}
            >
              {frequency} {'·'} +{xpReward} XP
              {streak > 0 ? ` · \u{1F525} ${streak} day streak` : ''}
            </Text>
          </View>

          {/* XP badge */}
          <View style={styles.xpColumn}>
            <Text
              style={{
                color: completed ? colors.primary : colors.xp,
                fontSize: typography.sizeBodySm,
                fontWeight: typography.weightBold,
              }}
            >
              +{xpReward}
            </Text>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 10,
                fontWeight: typography.weightBold,
                letterSpacing: 0.8,
              }}
            >
              XP
            </Text>
          </View>

          {/* Completion checkmark */}
          {completed && (
            <View
              style={[
                styles.checkmark,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.pill,
                },
              ]}
            >
              <Text style={styles.checkText}>{'✓'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    position: 'relative',
  },
  swipeBehind: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  swipeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    letterSpacing: -0.1,
  },
  progressTrack: {
    height: 4,
    overflow: 'hidden',
  },
  xpColumn: {
    marginRight: 8,
    alignItems: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
