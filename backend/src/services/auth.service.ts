import { userRepository } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { otpService } from './otp.service.js';
import { tokenService, type TokenPair } from './token.service.js';
import { signRegistrationToken, verifyRegistrationToken } from '../utils/jwt.js';
import { sha256 } from '../utils/crypto.js';
import { toUserDto, type UserDto } from '../dtos/user.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { UserRole, UserStatus } from '../types/enums.js';
import type { GeoPoint } from '../models/geo.schema.js';

interface SessionContext {
  userAgent?: string;
  ip?: string;
}

/** Roles a user may self-register as — admins are provisioned separately. */
const SELF_REGISTERABLE_ROLES: readonly UserRole[] = [
  UserRole.CUSTOMER,
  UserRole.VEHICLE_OWNER,
  UserRole.DRIVER,
];

export interface VerifyOtpResult {
  isNewUser: boolean;
  tokens?: TokenPair;
  user?: UserDto;
  /** Present only for a new phone: authorises the follow-up register call. */
  registrationToken?: string;
}

export interface RegisterInput {
  registrationToken: string;
  name: string;
  role: UserRole;
  email?: string;
  homeAddress?: string;
  location?: GeoPoint;
}

/**
 * Orchestrates the phone-first auth flow:
 *   1. requestOtp(phone)                  → sends a code
 *   2. verifyOtp(phone, code)             → existing user: logs in with tokens
 *                                            new phone: returns a registrationToken
 *   3. register(registrationToken, …)     → creates the account, returns tokens
 * plus refresh / logout / logoutAll.
 */
class AuthService {
  requestOtp(phone: string): Promise<{ devCode?: string }> {
    return otpService.requestOtp(phone);
  }

  async verifyOtp(
    phone: string,
    code: string,
    ctx: SessionContext,
  ): Promise<VerifyOtpResult> {
    await otpService.verifyOtp(phone, code);

    const user = await userRepository.findByPhone(phone);
    if (!user) {
      return { isNewUser: true, registrationToken: signRegistrationToken(phone) };
    }

    this.assertActive(user.status);
    if (!user.isPhoneVerified) {
      await userRepository.updateById(user._id, { isPhoneVerified: true });
    }

    const tokens = await tokenService.issuePair(user, ctx);
    return { isNewUser: false, tokens, user: toUserDto(user) };
  }

  async register(
    input: RegisterInput,
    ctx: SessionContext,
  ): Promise<{ tokens: TokenPair; user: UserDto }> {
    const { phone } = verifyRegistrationToken(input.registrationToken);

    if (!SELF_REGISTERABLE_ROLES.includes(input.role)) {
      throw ApiError.forbidden('This role cannot be self-registered');
    }
    if (await userRepository.existsByPhone(phone)) {
      throw ApiError.conflict('An account with this phone already exists');
    }

    const user = await userRepository.create({
      phone,
      name: input.name,
      role: input.role,
      email: input.email,
      homeAddress: input.homeAddress,
      location: input.location,
      isPhoneVerified: true,
      status: UserStatus.ACTIVE,
    });

    const tokens = await tokenService.issuePair(user, ctx);
    return { tokens, user: toUserDto(user) };
  }

  async refresh(rawRefreshToken: string, ctx: SessionContext): Promise<TokenPair> {
    // Resolve the owning user (needed to re-sign the access token); rotation and
    // reuse-detection then happen inside TokenService.
    const record = await refreshTokenRepository.findByHash(sha256(rawRefreshToken));
    if (!record) throw ApiError.unauthorized('Invalid refresh token');

    const user = await userRepository.findById(record.user);
    if (!user) throw ApiError.unauthorized('Account not found');
    this.assertActive(user.status);

    return tokenService.rotate(rawRefreshToken, user, ctx);
  }

  logout(rawRefreshToken: string): Promise<void> {
    return tokenService.revoke(rawRefreshToken);
  }

  logoutAll(userId: string): Promise<void> {
    return tokenService.revokeAll(userId);
  }

  async me(userId: string): Promise<UserDto> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return toUserDto(user);
  }

  private assertActive(status: UserStatus): void {
    if (status === UserStatus.SUSPENDED) {
      throw ApiError.forbidden('Your account is suspended. Contact support.');
    }
    if (status === UserStatus.DELETED) {
      throw ApiError.forbidden('This account no longer exists.');
    }
  }
}

export const authService = new AuthService();
