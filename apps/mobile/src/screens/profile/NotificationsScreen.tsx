import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUserSettings, updateSettings } from '../../store/slices/userSlice';

export const NotificationsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectUserSettings);

  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const soundEnabled = settings?.soundEnabled ?? true;

  const handleNotificationsToggle = (value: boolean) => {
    dispatch(updateSettings({ notificationsEnabled: value }));
  };

  const handleSoundToggle = (value: boolean) => {
    dispatch(updateSettings({ soundEnabled: value }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Reminders</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Daily Reminder</Text>
            <Text style={styles.rowDesc}>Get reminded to complete your dailies</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#3A3A55', true: '#2EA043' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Daily reminder"
          />
        </View>
        <View style={styles.row} accessible accessibilityRole="button" accessibilityLabel={`Reminder time: ${settings?.dailyReminderTime ?? '9:00 AM'}`}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Reminder Time</Text>
            <Text style={styles.rowDesc}>{settings?.dailyReminderTime ?? '9:00 AM'}</Text>
          </View>
          <Text style={styles.rowChevron}>{'\u{203A}'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Alerts</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Streak at Risk</Text>
            <Text style={styles.rowDesc}>Warn when streak might break</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#3A3A55', true: '#2EA043' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Streak at risk alerts"
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Achievements</Text>
            <Text style={styles.rowDesc}>Badge unlocks and level ups</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: '#3A3A55', true: '#2EA043' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Achievement notifications"
          />
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
