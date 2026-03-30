import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CustomerTabParamList } from './types';
import { ProfileScreen } from '../profile/screens/ProfileScreen';
import { PlaceholderScreen } from '../common/components/PlaceholderScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const HomeScreen = (): React.JSX.Element => (
  <PlaceholderScreen title="Find Transport" subtitle="Phase 5" />
);
const MyRequestsScreen = (): React.JSX.Element => (
  <PlaceholderScreen title="My Requests" subtitle="Phase 5" />
);
const ChatsScreen = (): React.JSX.Element => (
  <PlaceholderScreen title="Chats" subtitle="Phase 7" />
);

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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Find' }} />
      <Tab.Screen name="MyRequests" component={MyRequestsScreen} options={{ title: 'Requests' }} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
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
