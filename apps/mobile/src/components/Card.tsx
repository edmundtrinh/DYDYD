import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  header?: string;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, header, style }) => {
  const { colors, radii, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderRadius: radii.lg,
          borderColor: colors.border,
          padding: spacing.base,
        },
        style,
      ]}
    >
      {header && (
        <Text
          style={[
            styles.header,
            {
              color: colors.textTertiary,
              fontSize: typography.sizeMicro,
              fontWeight: typography.weightBold,
              marginBottom: spacing.sm,
            },
          ]}
          accessibilityRole="header"
        >
          {header}
        </Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
