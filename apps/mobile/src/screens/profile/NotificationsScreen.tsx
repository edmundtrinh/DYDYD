import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';

export const NotificationsScreen: React.FC = () => {
  // TODO: Wire to userSlice notification settings

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Daily Reminder</Text>
            <Text style={styles.rowDesc}>Get reminded to complete your dailies</Text>
          </View>
          <Switch value={true} disabled />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Reminder Time</Text>
            <Text style={styles.rowDesc}>9:00 AM</Text>
          </View>
          <Text style={styles.rowChevron}>›</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Streak at Risk</Text>
            <Text style={styles.rowDesc}>Warn when streak might break</Text>
          </View>
          <Switch value={true} disabled />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Achievements</Text>
            <Text style={styles.rowDesc}>Badge unlocks and level ups</Text>
          </View>
          <Switch value={true} disabled />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, gap: 32 },
  section: { gap: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888899', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A2E', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A3E' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, color: '#FFFFFF' },
  rowDesc: { fontSize: 13, color: '#888899', marginTop: 2 },
  rowChevron: { fontSize: 20, color: '#5A5A6E' },
});
