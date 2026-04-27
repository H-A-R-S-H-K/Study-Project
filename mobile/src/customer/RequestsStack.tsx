import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CustomerRequestsStackParamList } from '../navigation/types';
import { MyRequestsScreen } from './screens/MyRequestsScreen';
import { CreateRequestScreen } from './screens/CreateRequestScreen';
import { RequestDetailScreen } from './screens/RequestDetailScreen';
import { OffersListScreen } from '../offers/screens/OffersListScreen';

const Stack = createNativeStackNavigator<CustomerRequestsStackParamList>();

/** Customer "Requests" tab: history ↔ create ↔ detail ↔ offers. */
export function RequestsStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="MyRequests" component={MyRequestsScreen} options={{ title: 'My Requests' }} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'New Request' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request' }} />
      <Stack.Screen name="OffersList" component={OffersListScreen} options={{ title: 'Offers' }} />
    </Stack.Navigator>
  );
}
