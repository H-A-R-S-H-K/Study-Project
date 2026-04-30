import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProviderFeedStackParamList } from '../navigation/types';
import { RequestFeedScreen } from './screens/RequestFeedScreen';
import { MakeOfferScreen } from '../offers/screens/MakeOfferScreen';

const Stack = createNativeStackNavigator<ProviderFeedStackParamList>();

/** Provider "Requests" tab: nearby feed ↔ make offer. */
export function ProviderFeedStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="RequestFeed"
        component={RequestFeedScreen}
        options={{ title: 'Nearby Requests' }}
      />
      <Stack.Screen name="MakeOffer" component={MakeOfferScreen} options={{ title: 'Make an Offer' }} />
    </Stack.Navigator>
  );
}
