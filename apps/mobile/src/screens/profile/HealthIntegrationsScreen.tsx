import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';

export const HealthIntegrationsScreen: React.FC = () => {
  const integrations = [
    { name: 'Apple Health', emoji: '🍎', available: Platform.OS === 'ios', connected: false },
    { name: 'Google Fit', emoji: '🏃', available: Platform.OS === 'android', connected: false },
    { name: 'Apple Watch', emoji: '⌚', available: Platform.OS === 'ios', connected: false },
    { name: 'Garmin', emoji: '📡', available: true, connected: false },
    { name: 'Samsung Health', emoji: '📱', available: Platform.OS === 'android', connected: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        Connect health sources to automatically complete health-linked quests.
      </Text>
      {integrations.filter(i => i.available).map(integration => (
        <View key={integration.name} style={styles.card}>
          <Text style={styles.emoji}>{integration.emoji}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardName}>{integration.name}</Text>
            <Text style={styles.cardStatus}>
              {integration.connected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectText}>
              {integration.connected ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, gap: 12 },
  description: { fontSize: 14, color: '#888899', lineHeight: 22, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A2A3E', gap: 12 },
  emoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  cardStatus: { fontSize: 13, color: '#888899', marginTop: 2 },
  connectButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: '#2EA043' },
  connectText: { fontSize: 14, fontWeight: '600', color: '#2EA043' },
});
