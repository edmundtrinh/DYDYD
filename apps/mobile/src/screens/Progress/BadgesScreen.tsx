import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#2EA043',
  rare: '#2563EB',
  epic: '#7C3AED',
  legendary: '#F5B400',
  mythic: '#DC2626',
};

export const BadgesScreen: React.FC = () => {
  // TODO: Wire to progressSlice badges data

  const sampleBadges = [
    { id: '1', name: 'First Steps', description: 'Complete your first quest', rarity: 'common', earned: false },
    { id: '2', name: 'Streak Starter', description: 'Maintain a 3-day streak', rarity: 'common', earned: false },
    { id: '3', name: 'Week Warrior', description: 'Maintain a 7-day streak', rarity: 'uncommon', earned: false },
    { id: '4', name: 'Century Club', description: 'Complete 100 quests', rarity: 'rare', earned: false },
    { id: '5', name: 'Category Master', description: 'Max a single category', rarity: 'epic', earned: false },
    { id: '6', name: 'Completionist', description: 'Complete all daily quests for 30 days', rarity: 'legendary', earned: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.earned}>0 / {sampleBadges.length} earned</Text>
      <View style={styles.grid}>
        {sampleBadges.map(badge => (
          <View key={badge.id} style={[styles.card, !badge.earned && styles.cardLocked]}>
            <Text style={styles.badgeIcon}>🏅</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={[styles.rarity, { color: RARITY_COLORS[badge.rarity] }]}>
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </Text>
            <Text style={styles.badgeDesc}>{badge.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, gap: 20 },
  earned: { fontSize: 14, color: '#888899', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E', gap: 6 },
  cardLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 32 },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  rarity: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  badgeDesc: { fontSize: 12, color: '#888899', textAlign: 'center' },
});
