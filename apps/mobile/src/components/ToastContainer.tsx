import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../theme/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectToasts, hideToast } from '../store/slices/uiSlice';

const DEFAULT_DURATION = 3000;
const MAX_VISIBLE_TOASTS = 5;

const TOAST_ICONS: Record<string, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert',
  info: 'information',
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  type,
  title,
  message,
  duration = DEFAULT_DURATION,
  onDismiss,
}) => {
  const { colors, spacing, radii, typography } = useTheme();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      success: colors.success,
      error: colors.danger,
      warning: colors.warn,
      info: colors.info,
    };
    return colorMap[type] ?? colors.info;
  }, [type, colors]);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id, duration, onDismiss]);

  return (
    <Animated.View
      entering={FadeInDown.duration(250).springify()}
      exiting={FadeOutUp.duration(200)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          backgroundColor: colors.surface2,
          borderRadius: radii.md,
          borderLeftColor: accentColor,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.base,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <Icon name={TOAST_ICONS[type]} size={20} color={accentColor} />
      <View style={[styles.content, { marginLeft: spacing.md }]}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.sizeBodySm,
              fontWeight: typography.weightSemi,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {message ? (
          <Text
            style={[
              styles.message,
              {
                color: colors.textSecondary,
                fontSize: typography.sizeCaption,
                fontWeight: typography.weightRegular,
                marginTop: 2,
              },
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={() => onDismiss(id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ marginLeft: spacing.sm }}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss: ${title}`}
      >
        <Icon name="close" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const handleDismiss = useCallback(
    (id: string) => {
      dispatch(hideToast(id));
    },
    [dispatch],
  );

  if (toasts.length === 0) return null;

  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base },
      ]}
      pointerEvents="box-none"
    >
      {visibleToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onDismiss={handleDismiss}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  title: {
    letterSpacing: 0.1,
  },
  message: {
    letterSpacing: 0.1,
  },
});
