import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>DYDYD</Text>
        <Text style={styles.tagline}>Did You Do Your Dailies?</Text>
        <Text style={styles.subtitle}>Turn your habits into quests.{'\n'}Earn XP. Level up your life.</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.primaryButtonText}>Start Your Adventure</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'space-between', padding: 20 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  tagline: { fontSize: 18, fontWeight: '600', color: '#2EA043', marginTop: 8 },
  subtitle: { fontSize: 16, color: '#888899', textAlign: 'center', marginTop: 16, lineHeight: 24 },
  actions: { gap: 12, paddingBottom: 40 },
  primaryButton: { backgroundColor: '#2EA043', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { borderRadius: 9999, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E' },
  secondaryButtonText: { color: '#B7B7CC', fontSize: 16, fontWeight: '500' },
});
