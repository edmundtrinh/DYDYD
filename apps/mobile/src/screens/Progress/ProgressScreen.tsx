import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from '../../navigation/MainTabNavigator';

type Nav = NativeStackNavigationProp<ProgressStackParamList, 'ProgressMain'>;

const CATEGORIES = [
  { label: 'Physical', emoji: '💪', color: '#2EA043', count: 0 },
  { label: 'Mental', emoji: '🧠', color: '#7C3AED', count: 0 },
  { label: 'Career', emoji: '💼', color: '#2563EB', count: 0 },
  { label: 'Social', emoji: '❤️', color: '#DC2626', count: 0 },
  { label: 'Home', emoji: '🏠', color: '#EA580C', count: 0 },
];

export const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  // TODO: Wire to progressSlice and fetch real data

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Quests Done</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekChart}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.dayColumn}>
              <View style={[styles.dayBar, { height: 8 }]} />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>By Category</Text>
        </View>
        {CATEGORIES.map(cat => (
          <View key={cat.label} style={styles.categoryRow}>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryFill, { backgroundColor: cat.color, width: '0%' }]} />
            </View>
            <Text style={styles.categoryCount}>{cat.count}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.badgesLink} onPress={() => navigation.navigate('Badges')}>
        <Text style={styles.badgesLinkText}>🏆 View All Badges</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, gap: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#F5B400' },
  statLabel: { fontSize: 12, color: '#888899', marginTop: 4 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  weekChart: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A2A3E' },
  dayColumn: { alignItems: 'center', gap: 8 },
  dayBar: { width: 24, backgroundColor: '#2A2A3E', borderRadius: 4 },
  dayLabel: { fontSize: 12, color: '#888899' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { width: 64, fontSize: 14, color: '#B7B7CC' },
  categoryBar: { flex: 1, height: 8, backgroundColor: '#2A2A3E', borderRadius: 4, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 4 },
  categoryCount: { width: 32, fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  badgesLink: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E' },
  badgesLinkText: { fontSize: 16, fontWeight: '600', color: '#F5B400' },
});
