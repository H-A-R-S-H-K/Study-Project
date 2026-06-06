import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { tokenService, type TokenPair } from './token.service.js';
import { toUserDto, type UserDto } from '../dtos/user.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { UserRole, UserStatus } from '../types/enums.js';

/**
 * Admins authenticate with email + password (bcrypt), unlike app users who use
 * phone OTP — a browser dashboard can't receive an SMS code. Everything else
 * (JWT access + rotating refresh) is shared with the mobile auth stack.
 */
class AdminAuthService {
  async login(
    email: string,
    password: string,
    ctx: { userAgent?: string; ip?: string },
  ): Promise<{ tokens: TokenPair; user: UserDto }> {
    // passwordHash is select:false, so request it explicitly.
    const user = await User.findOne({ email: email.toLowerCase(), role: UserRole.ADMIN })
      .select('+passwordHash')
      .exec();

    if (!user || !user.passwordHash) throw ApiError.unauthorized('Invalid credentials');
    if (user.status !== UserStatus.ACTIVE) throw ApiError.forbidden('Account is not active');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid credentials');

    const tokens = await tokenService.issuePair(user, ctx);
    return { tokens, user: toUserDto(user) };
  }
}

export const adminAuthService = new AdminAuthService();
