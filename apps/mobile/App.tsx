// ============================================
// DYDYD Mobile App - Root Component
// ============================================

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';

import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useHealthSync } from './src/hooks/useHealthSync';
import { useWatchConnectivity } from './src/hooks/useWatchConnectivity';
import { LoadingScreen } from './src/components/LoadingScreen';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const AppContent: React.FC = () => {
  // Initialize health data sync
  const { initializeHealthSync } = useHealthSync();
  
  // Initialize watch connectivity
  const { initializeWatch } = useWatchConnectivity();

  useEffect(() => {
    // Initialize integrations
    initializeHealthSync();
    initializeWatch();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
