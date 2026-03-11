import type { UserRole } from './enums.js';

/** Payload embedded in a short-lived access token. */
export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  type: 'access';
}

/**
 * Payload embedded in the short-lived registration token issued after a phone
 * number is OTP-verified but before an account exists. It authorises exactly one
 * action: creating the account for that verified phone.
 */
export interface RegistrationTokenPayload {
  phone: string;
  type: 'registration';
}

/** Authenticated principal attached to the request by the auth middleware. */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
