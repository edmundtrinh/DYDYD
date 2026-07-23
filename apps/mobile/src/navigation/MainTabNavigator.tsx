// ============================================
// DYDYD - Main Tab Navigator
// ============================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import _Icon from 'react-native-vector-icons/Feather';
const Icon = _Icon as unknown as React.ComponentType<{ name: string; size: number; color: string }>;

import { useTheme } from '../theme/ThemeProvider';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { QuestsScreen } from '../screens/quests/QuestsScreen';
import { QuestDetailScreen } from '../screens/quests/QuestDetailScreen';
import { AddQuestScreen } from '../screens/quests/AddQuestScreen';
import { ProgressScreen } from '../screens/Progress/ProgressScreen';
import { BadgesScreen } from '../screens/Progress/BadgesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { HealthIntegrationsScreen } from '../screens/profile/HealthIntegrationsScreen';
import { SpriteScreen } from '../screens/SpriteScreen';

// Type definitions for navigation
export type HomeStackParamList = {
  HomeMain: undefined;
  QuestDetail: { questId: string };
  QuickComplete: { questId: string };
};

export type QuestsStackParamList = {
  QuestsList: undefined;
  QuestDetail: { questId: string };
  AddQuest: { category?: string };
  EditQuest: { questId: string };
};

export type ProgressStackParamList = {
  ProgressMain: undefined;
  Badges: undefined;
  Leaderboard: undefined;
  DetailedStats: { category?: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Notifications: undefined;
  HealthIntegrations: undefined;
  Premium: undefined;
  About: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Quests: undefined;
  Progress: undefined;
  Sprite: undefined;
  Profile: undefined;
};

// Stack navigators for each tab
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const QuestsStack = createNativeStackNavigator<QuestsStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Home Stack Navigator
const HomeStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Today' }}
      />
      <HomeStack.Screen
        name="QuestDetail"
        component={QuestDetailScreen}
        options={{ title: 'Quest Details' }}
      />
    </HomeStack.Navigator>
  );
};

// Quests Stack Navigator
const QuestsStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <QuestsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <QuestsStack.Screen
        name="QuestsList"
        component={QuestsScreen}
        options={{ title: 'My Quests' }}
      />
      <QuestsStack.Screen
        name="QuestDetail"
        component={QuestDetailScreen}
        options={{ title: 'Quest Details' }}
      />
      <QuestsStack.Screen
        name="AddQuest"
        component={AddQuestScreen}
        options={{ title: 'Add Quest', presentation: 'modal' }}
      />
    </QuestsStack.Navigator>
  );
};

// Progress Stack Navigator
const ProgressStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <ProgressStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProgressStack.Screen
        name="ProgressMain"
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
      <ProgressStack.Screen
        name="Badges"
        component={BadgesScreen}
        options={{ title: 'Badges' }}
      />
    </ProgressStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <ProfileStack.Screen
        name="HealthIntegrations"
        component={HealthIntegrationsScreen}
        options={{ title: 'Health Integrations' }}
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
export const MainTabNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Quests':
              iconName = 'list';
              break;
            case 'Progress':
              iconName = 'bar-chart-2';
              break;
            case 'Sprite':
              iconName = 'zap';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Quests" component={QuestsStackNavigator} />
      <Tab.Screen name="Progress" component={ProgressStackNavigator} />
      <Tab.Screen
        name="Sprite"
        component={SpriteScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
