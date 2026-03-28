import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { VehiclesStackParamList } from '../navigation/types';
import { VehicleListScreen } from './screens/VehicleListScreen';
import { VehicleFormScreen } from './screens/VehicleFormScreen';

const Stack = createNativeStackNavigator<VehiclesStackParamList>();

/** The "Manage" tab for vehicle owners: list ↔ add/edit form. */
export function VehiclesStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="VehicleList"
        component={VehicleListScreen}
        options={{ title: 'My Vehicles' }}
      />
      <Stack.Screen
        name="VehicleForm"
        component={VehicleFormScreen}
        options={({ route }) => ({
          title: route.params.vehicleId ? 'Edit Vehicle' : 'Add Vehicle',
        })}
      />
    </Stack.Navigator>
  );
}
