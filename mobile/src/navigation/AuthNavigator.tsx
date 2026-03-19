import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { WelcomeScreen } from '../auth/screens/WelcomeScreen';
import { PhoneEntryScreen } from '../auth/screens/PhoneEntryScreen';
import { OtpVerifyScreen } from '../auth/screens/OtpVerifyScreen';
import { RoleSelectScreen } from '../auth/screens/RoleSelectScreen';
import { ProfileSetupScreen } from '../auth/screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/** The unauthenticated flow: welcome → phone → OTP → (new user) role → profile. */
export function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerShadowVisible: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} options={{ title: '' }} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: '' }} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: '' }} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
