import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Strongly-typed navigation trees. Every screen's params are declared here so
 * `navigation.navigate` and `route.params` are fully type-checked — no string
 * typos, no untyped params.
 */
import type { UserRole } from '../types/domain';

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OtpVerify: { phone: string };
  RoleSelect: { registrationToken: string };
  ProfileSetup: { registrationToken: string; role: UserRole };
};

export type CustomerTabParamList = {
  Home: undefined;
  MyRequests: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type ProviderTabParamList = {
  Feed: undefined;
  Manage: undefined; // Vehicles (owner) or Driver profile (driver)
  Chats: undefined;
  Profile: undefined;
};

/** Nested stack for the vehicle owner's "Manage" tab. */
export type VehiclesStackParamList = {
  VehicleList: undefined;
  VehicleForm: { vehicleId?: string };
};

/** Nested stack for the customer's "Requests" tab. */
export type CustomerRequestsStackParamList = {
  MyRequests: undefined;
  CreateRequest: undefined;
  RequestDetail: { requestId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  CustomerApp: NavigatorScreenParams<CustomerTabParamList>;
  ProviderApp: NavigatorScreenParams<ProviderTabParamList>;
  // Shared modals mounted above the tabs (created in later phases):
  RequestDetail: { requestId: string };
  ChatRoom: { chatId: string };
};
