import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/MainTabNavigator';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  // TODO: Wire to userSlice settings

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch value={true} disabled />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Haptic Feedback</Text>
          <Switch value={true} disabled />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('HealthIntegrations')}>
          <Text style={styles.rowLabel}>Health Integrations</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Export Data</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={[styles.rowLabel, { color: '#DC2626' }]}>Delete Account</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>DYDYD v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { padding: 20, gap: 32 },
  section: { gap: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888899', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A2E', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A3E' },
  rowLabel: { fontSize: 16, color: '#FFFFFF' },
  rowChevron: { fontSize: 20, color: '#5A5A6E' },
  version: { fontSize: 12, color: '#5A5A6E', textAlign: 'center', marginTop: 16 },
});
