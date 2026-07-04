import { env, isProd } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * SMS delivery behind a single interface. In production, when `SMS_PROVIDER_KEY`
 * is set, messages go out via an HTTP gateway; otherwise (dev/test) they are
 * logged so the OTP flow stays exercisable without a paid provider. Swapping in
 * Twilio/MSG91/etc. means implementing `SmsProvider` — nothing else changes.
 */
export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

/** Dev/test provider: logs instead of sending. */
class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    logger.warn({ to, message }, '📱 SMS (console provider — not actually sent)');
  }
}

/**
 * Generic HTTP gateway provider. The exact request shape is provider-specific;
 * this shows where the real integration slots in for the deployment target.
 */
class HttpSmsProvider implements SmsProvider {
  constructor(private readonly apiKey: string) {}

  async send(to: string, message: string): Promise<void> {
    // Example shape — replace endpoint/body with the chosen provider's API.
    const res = await fetch('https://sms-gateway.example.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ to, message }),
    });
    if (!res.ok) {
      throw new Error(`SMS gateway responded ${res.status}`);
    }
  }
}

const provider: SmsProvider =
  isProd && env.SMS_PROVIDER_KEY
    ? new HttpSmsProvider(env.SMS_PROVIDER_KEY)
    : new ConsoleSmsProvider();

export const smsService: SmsProvider = provider;
