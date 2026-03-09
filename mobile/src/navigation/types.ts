import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Strongly-typed navigation trees. Every screen's params are declared here so
 * `navigation.navigate` and `route.params` are fully type-checked — no string
 * typos, no untyped params.
 */
export type AuthStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OtpVerify: { phone: string };
  RoleSelect: undefined;
  ProfileSetup: { role: string };
};

export type CustomerTabParamList = {
  Home: undefined;
  MyRequests: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type ProviderTabParamList = {
  Feed: undefined;
  MyOffers: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  CustomerApp: NavigatorScreenParams<CustomerTabParamList>;
  ProviderApp: NavigatorScreenParams<ProviderTabParamList>;
  // Shared modals mounted above the tabs (created in later phases):
  RequestDetail: { requestId: string };
  ChatRoom: { chatId: string };
};
