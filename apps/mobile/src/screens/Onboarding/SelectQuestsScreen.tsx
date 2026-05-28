import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'SelectQuests'>;

export const SelectQuestsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]);
  };

  // TODO: Load from PREDEFINED_QUESTS via @dydyd/shared
  const sampleQuests = [
    { id: '1', emoji: '🚶', name: 'Walk 10,000 steps', category: 'Physical Health' },
    { id: '2', emoji: '💧', name: 'Drink 8 glasses of water', category: 'Physical Health' },
    { id: '3', emoji: '🧘', name: 'Meditate for 10 minutes', category: 'Mental Wellness' },
    { id: '4', emoji: '📖', name: 'Read for 20 minutes', category: 'Mental Wellness' },
    { id: '5', emoji: '📝', name: 'Journal for 5 minutes', category: 'Mental Wellness' },
    { id: '6', emoji: '🛏️', name: 'Make your bed', category: 'Home & Chores' },
    { id: '7', emoji: '📞', name: 'Call a friend or family member', category: 'Relationships & Social' },
    { id: '8', emoji: '📚', name: 'Learn something new for 15 min', category: 'Career & Productivity' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 5</Text>
        <Text style={styles.title}>Choose your first quests</Text>
        <Text style={styles.subtitle}>Select at least 3 quests to get started. You can always change these later.</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sampleQuests.map(q => (
          <TouchableOpacity
            key={q.id}
            style={[styles.card, selected.includes(q.id) && styles.cardSelected]}
            onPress={() => toggle(q.id)}
          >
            <Text style={styles.emoji}>{q.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={styles.questName}>{q.name}</Text>
              <Text style={styles.questCategory}>{q.category}</Text>
            </View>
            {selected.includes(q.id) && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.button, selected.length < 3 && styles.buttonDisabled]}
        onPress={() => navigation.navigate('HealthPermissions')}
        disabled={selected.length < 3}
      >
        <Text style={styles.buttonText}>{selected.length} selected — Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', padding: 20 },
  header: { marginTop: 60, marginBottom: 24 },
  step: { fontSize: 12, fontWeight: '700', color: '#888899', textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  subtitle: { fontSize: 16, color: '#888899', marginTop: 8, lineHeight: 24 },
  scroll: { flex: 1 },
  scrollContent: { gap: 10, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A2A3E', gap: 12 },
  cardSelected: { borderColor: '#2EA043' },
  emoji: { fontSize: 24 },
  cardText: { flex: 1 },
  questName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  questCategory: { fontSize: 13, color: '#888899', marginTop: 2 },
  check: { fontSize: 18, color: '#2EA043', fontWeight: '700' },
  button: { backgroundColor: '#2EA043', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 40, marginTop: 16 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
