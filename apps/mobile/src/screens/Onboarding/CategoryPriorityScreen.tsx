import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'CategoryPriority'>;

const CATEGORIES = [
  { id: 'PHYSICAL_HEALTH', emoji: '💪', label: 'Physical Health', color: '#2EA043' },
  { id: 'MENTAL_WELLNESS', emoji: '🧠', label: 'Mental Wellness', color: '#7C3AED' },
  { id: 'CAREER_PRODUCTIVITY', emoji: '💼', label: 'Career & Productivity', color: '#2563EB' },
  { id: 'RELATIONSHIPS_SOCIAL', emoji: '❤️', label: 'Relationships & Social', color: '#DC2626' },
  { id: 'HOME_CHORES', emoji: '🏠', label: 'Home & Chores', color: '#EA580C' },
];

export const CategoryPriorityScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [priorities, setPriorities] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setPriorities(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 5</Text>
        <Text style={styles.title}>What matters most to you?</Text>
        <Text style={styles.subtitle}>Rank your priorities. Tap categories in order of importance.</Text>
      </View>
      <View style={styles.list}>
        {CATEGORIES.map(cat => {
          const idx = priorities.indexOf(cat.id);
          const selected = idx >= 0;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.card, selected && { borderColor: cat.color }]}
              onPress={() => toggleCategory(cat.id)}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={styles.cardLabel}>{cat.label}</Text>
              {selected && <Text style={[styles.rank, { color: cat.color }]}>#{idx + 1}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        style={[styles.button, priorities.length === 0 && styles.buttonDisabled]}
        onPress={() => navigation.navigate('SelectQuests')}
        disabled={priorities.length === 0}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', padding: 20, justifyContent: 'space-between' },
  header: { marginTop: 60 },
  step: { fontSize: 12, fontWeight: '700', color: '#888899', textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  subtitle: { fontSize: 16, color: '#888899', marginTop: 8, lineHeight: 24 },
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A2A3E', gap: 12 },
  emoji: { fontSize: 24 },
  cardLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  rank: { fontSize: 16, fontWeight: '800' },
  button: { backgroundColor: '#2EA043', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 40 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
