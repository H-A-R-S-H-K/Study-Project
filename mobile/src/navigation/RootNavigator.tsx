import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../redux/store';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { ProviderNavigator } from './ProviderNavigator';

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
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isCustomer ? (
          <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
        ) : (
          <Stack.Screen name="ProviderApp" component={ProviderNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
