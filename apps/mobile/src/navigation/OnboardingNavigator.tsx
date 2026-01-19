// ============================================
// DYDYD - Onboarding Navigator
// ============================================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CategoryPriorityScreen } from '../screens/Onboarding/CategoryPriorityScreen';
import { SelectQuestsScreen } from '../screens/Onboarding/SelectQuestsScreen';
import { HealthPermissionsScreen } from '../screens/Onboarding/HealthPermissionsScreen';
import { NotificationPermissionsScreen } from '../screens/Onboarding/NotificationPermissionsScreen';
import { OnboardingCompleteScreen } from '../screens/Onboarding/OnboardingCompleteScreen';

export type OnboardingStackParamList = {
  CategoryPriority: undefined;
  SelectQuests: undefined;
  HealthPermissions: undefined;
  NotificationPermissions: undefined;
  OnboardingComplete: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="CategoryPriority"
    >
      <Stack.Screen name="CategoryPriority" component={CategoryPriorityScreen} />
      <Stack.Screen name="SelectQuests" component={SelectQuestsScreen} />
      <Stack.Screen name="HealthPermissions" component={HealthPermissionsScreen} />
      <Stack.Screen name="NotificationPermissions" component={NotificationPermissionsScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
};
