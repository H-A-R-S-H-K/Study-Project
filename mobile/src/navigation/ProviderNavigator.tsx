import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ProviderTabParamList } from './types';
import { useAppSelector } from '../redux/store';
import { VehiclesStack } from '../vehicleOwner/VehiclesStack';
import { DriverProfileScreen } from '../driver/screens/DriverProfileScreen';
import { ProfileScreen } from '../profile/screens/ProfileScreen';
import { PlaceholderScreen } from '../common/components/PlaceholderScreen';

const Tab = createBottomTabNavigator<ProviderTabParamList>();

const FeedScreen = (): React.JSX.Element => (
  <PlaceholderScreen title="Nearby Requests" subtitle="Phase 5" />
);
const ChatsScreen = (): React.JSX.Element => (
  <PlaceholderScreen title="Chats" subtitle="Phase 7" />
);

/**
 * Provider bottom tabs. The "Manage" tab is role-aware: vehicle owners get the
 * vehicles stack, drivers get their profile editor. This is where Phase 3's
 * role-management screens plug into the app shell.
 */
export function ProviderNavigator(): React.JSX.Element {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isOwner = role === 'vehicle_owner';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name !== 'Manage', // Manage owns its own header stack
        tabBarIcon: ({ color, size }) => <Icon name={iconFor(route.name)} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Requests' }} />
      <Tab.Screen
        name="Manage"
        component={isOwner ? VehiclesStack : DriverProfileScreen}
        options={{ title: isOwner ? 'Vehicles' : 'My Profile' }}
      />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function iconFor(name: keyof ProviderTabParamList): string {
  switch (name) {
    case 'Feed':
      return 'clipboard-list-outline';
    case 'Manage':
      return 'truck-outline';
    case 'Chats':
      return 'chat-outline';
    case 'Profile':
      return 'account-outline';
  }
}
