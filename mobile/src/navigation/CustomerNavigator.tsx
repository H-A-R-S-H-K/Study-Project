import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CustomerTabParamList } from './types';
import { ProfileScreen } from '../profile/screens/ProfileScreen';
import { NearbyProvidersScreen } from '../customer/screens/NearbyProvidersScreen';
import { RequestsStack } from '../customer/RequestsStack';
import { ConversationsScreen } from '../chat/screens/ConversationsScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

/** Customer bottom tabs. Home/Requests/Chats fill in over Phases 5–7. */
export function CustomerNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Icon name={iconFor(route.name)} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={NearbyProvidersScreen} options={{ title: 'Find' }} />
      <Tab.Screen
        name="MyRequests"
        component={RequestsStack}
        options={{ title: 'Requests', headerShown: false }}
      />
      <Tab.Screen name="Chats" component={ConversationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function iconFor(name: keyof CustomerTabParamList): string {
  switch (name) {
    case 'Home':
      return 'magnify';
    case 'MyRequests':
      return 'clipboard-text-outline';
    case 'Chats':
      return 'chat-outline';
    case 'Profile':
      return 'account-outline';
  }
}
