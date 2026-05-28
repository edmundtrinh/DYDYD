import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppDispatch } from '../../store/hooks';
import { setOnboarded } from '../../store/slices/authSlice';

export const OnboardingCompleteScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>⚔️</Text>
        <Text style={styles.title}>You're ready, Adventurer</Text>
        <Text style={styles.subtitle}>Your quests are set. Your journey begins now. Go earn some XP.</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => dispatch(setOnboarded(true))}>
        <Text style={styles.buttonText}>Begin Your Journey</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', padding: 20, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 24, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888899', marginTop: 12, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  button: { backgroundColor: '#2EA043', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 40 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
