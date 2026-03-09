import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../redux/store';
import type { RootStackParamList } from './types';
import { PlaceholderScreen } from '../common/components/PlaceholderScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level navigator. It switches trees on auth + role:
 *   - not authenticated        → Auth flow
 *   - authenticated customer   → Customer tabs
 *   - authenticated provider   → Provider tabs
 *
 * Real screens replace the placeholders phase by phase (Auth in Phase 2,
 * feeds/requests in Phase 5+). Keeping the switch here means the whole app's
 * entry logic lives in one readable place.
 */
export function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const isCustomer = user?.role === 'customer';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth">
            {() => <PlaceholderScreen title="Authentication" subtitle="Phase 2" />}
          </Stack.Screen>
        ) : isCustomer ? (
          <Stack.Screen name="CustomerApp">
            {() => <PlaceholderScreen title="Customer Home" subtitle="Phase 5" />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="ProviderApp">
            {() => <PlaceholderScreen title="Provider Feed" subtitle="Phase 5" />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
