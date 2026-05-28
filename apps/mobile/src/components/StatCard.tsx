import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  sublabel?: string;
  color: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  sublabel,
  color,
  style,
}) => {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderRadius: radii.md,
          borderColor: colors.border,
          borderTopColor: color,
          padding: spacing.md,
        },
        style,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[
          styles.value,
          {
            color: colors.text,
            fontSize: typography.sizeH2,
            fontWeight: typography.weightHeavy,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: colors.textTertiary,
            fontSize: 10,
            fontWeight: typography.weightBold,
          },
        ]}
      >
        {label}
      </Text>
      {sublabel && (
        <Text
          style={{
            color: colors.textDisabled,
            fontSize: 9,
          }}
        >
          {sublabel}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderTopWidth: 3,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
  },
  value: {
    letterSpacing: -0.4,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
