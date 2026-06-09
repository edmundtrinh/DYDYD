import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { QuestCategory, QuestFrequency } from '@dydyd/shared';
import { useAppDispatch } from '../../store/hooks';
import { createCustomQuest } from '../../store/slices/questsSlice';
import { showToast } from '../../store/slices/uiSlice';

const CATEGORIES = [
  { id: QuestCategory.PHYSICAL_HEALTH, label: 'Physical Health', emoji: '\u{1F4AA}', color: '#2EA043' },
  { id: QuestCategory.MENTAL_WELLNESS, label: 'Mental Wellness', emoji: '\u{1F9E0}', color: '#7C3AED' },
  { id: QuestCategory.CAREER_PRODUCTIVITY, label: 'Career & Productivity', emoji: '\u{1F4BC}', color: '#2563EB' },
  { id: QuestCategory.RELATIONSHIPS_SOCIAL, label: 'Relationships & Social', emoji: '\u{2764}\u{FE0F}', color: '#DC2626' },
  { id: QuestCategory.HOME_CHORES, label: 'Home & Chores', emoji: '\u{1F3E0}', color: '#EA580C' },
];

const FREQUENCIES: { value: QuestFrequency; label: string }[] = [
  { value: QuestFrequency.DAILY, label: 'Daily' },
  { value: QuestFrequency.WEEKLY, label: 'Weekly' },
  { value: QuestFrequency.MONTHLY, label: 'Monthly' },
];

export const AddQuestScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory | ''>('');
  const [frequency, setFrequency] = useState<QuestFrequency>(QuestFrequency.DAILY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Quest needs a name', 'Every quest needs a title, Adventurer.');
      return;
    }
    if (!category) {
      Alert.alert('Choose a category', 'Select which life area this quest belongs to.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createCustomQuest({
          name: name.trim(),
          description: description.trim(),
          category,
          frequency,
          baseXP: 5,
          maxCompletionsPerPeriod: 1,
          iconName: 'star',
        }),
      ).unwrap();

      dispatch(
        showToast({
          type: 'success',
          title: 'Quest created!',
          message: `"${name.trim()}" has been added to your quests.`,
        }),
      );
      navigation.goBack();
    } catch (error: any) {
      dispatch(
        showToast({
          type: 'error',
          title: 'Failed to create quest',
          message: error || 'Something went wrong. Please try again.',
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
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
              accessibilityRole="radio"
              accessibilityState={{ selected: category === cat.id }}
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
              key={f.value}
              style={[styles.freqChip, frequency === f.value && styles.freqChipActive]}
              onPress={() => setFrequency(f.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: frequency === f.value }}
            >
              <Text style={[styles.freqText, frequency === f.value && styles.freqTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={isSubmitting}
      >
        <Text style={styles.createButtonText}>
          {isSubmitting ? 'Creating...' : 'Create Quest'}
        </Text>
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
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
