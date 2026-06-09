// ============================================
// DYDYD - Root Navigator
// ============================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectIsOnboarded } from '../store/slices/authSlice';
import { ToastContainer } from '../components/ToastContainer';
import { BadgeEarnedModal } from '../components/BadgeEarnedModal';

import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isOnboarded = useAppSelector(selectIsOnboarded);

  return (
    <View style={styles.root}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
      <ToastContainer />
      <BadgeEarnedModal />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
