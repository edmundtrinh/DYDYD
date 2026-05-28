import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = [
  { id: 'PHYSICAL_HEALTH', label: 'Physical Health', emoji: '💪', color: '#2EA043' },
  { id: 'MENTAL_WELLNESS', label: 'Mental Wellness', emoji: '🧠', color: '#7C3AED' },
  { id: 'CAREER_PRODUCTIVITY', label: 'Career & Productivity', emoji: '💼', color: '#2563EB' },
  { id: 'RELATIONSHIPS_SOCIAL', label: 'Relationships & Social', emoji: '❤️', color: '#DC2626' },
  { id: 'HOME_CHORES', label: 'Home & Chores', emoji: '🏠', color: '#EA580C' },
];

const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

export const AddQuestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>('daily');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Quest needs a name', 'Every quest needs a title, Adventurer.');
      return;
    }
    if (!category) {
      Alert.alert('Choose a category', 'Select which life area this quest belongs to.');
      return;
    }
    // TODO: Dispatch createCustomQuest action
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>Quest Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Practice guitar for 20 minutes"
          placeholderTextColor="#5A5A6E"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Add details about this quest..."
          placeholderTextColor="#5A5A6E"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, category === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[styles.chipLabel, category === cat.id && { color: cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.freqChip, frequency === f && styles.freqChipActive]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>Create Quest</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, gap: 24 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#B7B7CC' },
  input: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2A2A3E' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  chips: { gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2A2A3E' },
  chipEmoji: { fontSize: 20 },
  chipLabel: { fontSize: 15, color: '#B7B7CC', fontWeight: '500' },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqChip: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 9999, borderWidth: 1, borderColor: '#2A2A3E' },
  freqChipActive: { borderColor: '#2EA043', backgroundColor: '#2EA04320' },
  freqText: { fontSize: 14, fontWeight: '600', color: '#888899' },
  freqTextActive: { color: '#2EA043' },
  createButton: { backgroundColor: '#2EA043', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
