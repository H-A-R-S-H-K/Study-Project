import type { IUser } from '../models/index.js';
import type { UserRole, UserStatus } from '../types/enums.js';

/**
 * Public shape of a user sent to clients. Deliberately omits sensitive/internal
 * fields (fcmTokens, __v, raw location internals). Mapping through a DTO means an
 * accidental `res.json(userDoc)` can never leak internal data.
 */
export interface UserDto {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  isPhoneVerified: boolean;
  ratingSummary: { average: number; count: number };
  homeAddress?: string;
  createdAt: Date;
}

export function toUserDto(user: IUser): UserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    isPhoneVerified: user.isPhoneVerified,
    ratingSummary: user.ratingSummary,
    homeAddress: user.homeAddress,
    createdAt: user.createdAt,
  };
}
