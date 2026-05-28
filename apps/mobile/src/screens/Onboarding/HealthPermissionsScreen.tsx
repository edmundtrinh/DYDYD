import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'HealthPermissions'>;

export const HealthPermissionsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const healthSource = Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';

  const handleAllow = () => {
    // TODO: Phase 2 — Request HealthKit/Google Fit permissions
    navigation.navigate('NotificationPermissions');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 5</Text>
        <Text style={styles.title}>Sync your health data</Text>
        <Text style={styles.subtitle}>
          Connect {healthSource} to automatically complete health quests like steps, sleep, and exercise.
        </Text>
      </View>
      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>🚶</Text>
          <Text style={styles.featureText}>Auto-track daily steps</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>😴</Text>
          <Text style={styles.featureText}>Monitor sleep duration</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>🏋️</Text>
          <Text style={styles.featureText}>Log exercise automatically</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleAllow}>
          <Text style={styles.buttonText}>Connect {healthSource}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('NotificationPermissions')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', padding: 20, justifyContent: 'space-between' },
  header: { marginTop: 60 },
  step: { fontSize: 12, fontWeight: '700', color: '#888899', textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  subtitle: { fontSize: 16, color: '#888899', marginTop: 8, lineHeight: 24 },
  features: { gap: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureEmoji: { fontSize: 32 },
  featureText: { fontSize: 16, color: '#B7B7CC', fontWeight: '500' },
  actions: { gap: 16, marginBottom: 40 },
  button: { backgroundColor: '#2EA043', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skipText: { color: '#888899', fontSize: 14, textAlign: 'center' },
});
