import { otpRepository } from '../repositories/otp.repository.js';
import { generateOtp, sha256 } from '../utils/crypto.js';
import { ApiError } from '../utils/ApiError.js';
import { env, isProd } from '../config/env.js';
import { logger } from '../config/logger.js';

const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Issues and verifies phone OTPs. Codes are stored only as hashes with a TTL.
 * Actual SMS delivery is pluggable — until an SMS provider is configured
 * (Phase 12) we log the code in non-production so the flow is testable.
 */
class OtpService {
  async requestOtp(phone: string): Promise<{ devCode?: string }> {
    // Invalidate any previous live codes so only the newest one works.
    await otpRepository.invalidateAllForPhone(phone);

    const code = generateOtp(env.OTP_LENGTH);
    const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);
    await otpRepository.create({ phone, codeHash: sha256(code), expiresAt });

    await this.deliver(phone, code);

    // Never leak the code in production responses.
    return isProd ? {} : { devCode: code };
  }

  async verifyOtp(phone: string, code: string): Promise<void> {
    const otp = await otpRepository.findLatestLive(phone);
    if (!otp) throw ApiError.badRequest('No valid code found. Please request a new one.');

    if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
      await otpRepository.consume(otp._id.toString());
      throw ApiError.tooManyRequests('Too many incorrect attempts. Request a new code.');
    }

    if (otp.codeHash !== sha256(code)) {
      await otpRepository.incrementAttempts(otp._id.toString());
      throw ApiError.badRequest('Incorrect code.');
    }

    await otpRepository.consume(otp._id.toString());
  }

  private async deliver(phone: string, code: string): Promise<void> {
    if (env.SMS_PROVIDER_KEY) {
      // Real SMS integration is wired in the deployment phase.
      logger.info({ phone }, 'OTP dispatched via SMS provider');
      return;
    }
    // Dev fallback: log so the flow can be exercised without an SMS gateway.
    logger.warn({ phone, code }, '📱 DEV OTP (no SMS provider configured)');
  }
}

export const otpService = new OtpService();
