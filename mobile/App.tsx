import React from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor, useAppSelector } from './src/redux/store';
import { queryClient } from './src/services/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePushRegistration } from './src/notifications/hooks/useNotifications';
import { lightTheme, darkTheme } from './src/theme';

/**
 * Provider tree, outermost → innermost:
 *   GestureHandler → SafeArea → Redux → PersistGate → ReactQuery → Paper(theme) → Navigation
 * Order matters: Redux must wrap the theme selector; Paper must wrap navigation
 * so screens can call useTheme().
 */
function ThemedApp(): React.JSX.Element {
  const system = useColorScheme();
  const themeMode = useAppSelector((s) => s.ui.themeMode);
  const isDark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';

  // Register for push + wire token-refresh/foreground handling once authed.
  usePushRegistration();

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <RootNavigator />
    </PaperProvider>
  );
}

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <ThemedApp />
            </QueryClientProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
