import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container} accessible accessibilityLabel="Loading DYDYD">
      <Text style={styles.logo} accessible={false}>DYDYD</Text>
      <ActivityIndicator size="large" color="#2EA043" accessibilityLabel="Loading" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
    gap: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
});
