import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/MainTabNavigator';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUserSettings, updateSettings, deleteAccount } from '../../store/slices/userSlice';
import { selectTheme, setTheme } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectUserSettings);
  const theme = useAppSelector(selectTheme);

  const isDarkMode = theme === 'dark';
  const hapticEnabled = settings?.hapticFeedbackEnabled ?? true;

  const handleDarkModeToggle = (value: boolean) => {
    dispatch(setTheme(value ? 'dark' : 'light'));
  };

  const handleHapticToggle = (value: boolean) => {
    dispatch(updateSettings({ hapticFeedbackEnabled: value }));
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Delete Account',
        'This action is permanent and cannot be undone. Enter your password to confirm.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: (password?: string) => {
              if (password) {
                dispatch(deleteAccount(password));
              }
            },
          },
        ],
        'secure-text'
      );
    } else {
      // TODO: Android needs a dedicated screen with password TextInput (Alert.prompt is iOS-only)
      Alert.alert(
        'Delete Account',
        'This action is permanent and cannot be undone. A password confirmation screen will be added in a future update.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#3A3A55', true: '#2EA043' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Dark mode"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Haptic Feedback</Text>
          <Switch
            value={hapticEnabled}
            onValueChange={handleHapticToggle}
            trackColor={{ false: '#3A3A55', true: '#2EA043' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Haptic feedback"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Integrations</Text>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Notifications')} accessibilityRole="button" accessibilityLabel="Notifications">
          <Text style={styles.rowLabel}>Notifications</Text>
          <Text style={styles.rowChevron}>{'\u{203A}'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('HealthIntegrations')} accessibilityRole="button" accessibilityLabel="Health integrations">
          <Text style={styles.rowLabel}>Health Integrations</Text>
          <Text style={styles.rowChevron}>{'\u{203A}'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Account</Text>
        <TouchableOpacity style={styles.row} accessibilityRole="button" accessibilityLabel="Export data">
          <Text style={styles.rowLabel}>Export Data</Text>
          <Text style={styles.rowChevron}>{'\u{203A}'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out">
          <Text style={styles.rowLabel}>Log Out</Text>
          <Text style={styles.rowChevron}>{'\u{203A}'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} accessibilityRole="button" accessibilityLabel="Delete account" accessibilityHint="This will permanently delete your account and all data">
          <Text style={[styles.rowLabel, { color: '#DC2626' }]}>Delete Account</Text>
          <Text style={styles.rowChevron}>{'\u{203A}'}</Text>
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
