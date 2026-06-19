import request from 'supertest';
import type { Application } from 'express';
import { createApp } from '../src/app.js';
import type { UserRole } from '../src/types/enums.js';

export const app: Application = createApp();
export const agent = (): request.Agent => request(app);

let phoneSeq = 1000;
export function nextPhone(): string {
  phoneSeq += 1;
  return `+9198765${String(phoneSeq).padStart(5, '0')}`;
}

export interface TestUser {
  token: string;
  refreshToken: string;
  id: string;
  phone: string;
}

/** Registers a user through the real auth flow and returns their tokens + id. */
export async function registerUser(role: UserRole, name = 'Test User'): Promise<TestUser> {
  const phone = nextPhone();
  const otpRes = await agent().post('/api/v1/auth/otp/request').send({ phone });
  const code = otpRes.body.data.devCode as string;

  const verifyRes = await agent().post('/api/v1/auth/otp/verify').send({ phone, code });
  const registrationToken = verifyRes.body.data.registrationToken as string;

  const regRes = await agent()
    .post('/api/v1/auth/register')
    .send({ registrationToken, name, role });

  return {
    token: regRes.body.data.tokens.accessToken,
    refreshToken: regRes.body.data.tokens.refreshToken,
    id: regRes.body.data.user.id,
    phone,
  };
}

export const auth = (token: string): string => `Bearer ${token}`;

const TOMORROW = (): string => new Date(Date.now() + 86_400_000).toISOString();

/** Creates an open request as the given customer; returns its id. */
export async function createRequest(
  customerToken: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const res = await agent()
    .post('/api/v1/requests')
    .set('Authorization', auth(customerToken))
    .send({
      pickup: {
        address: 'Village A',
        location: { type: 'Point', coordinates: [73.87, 18.52] },
      },
      destination: {
        address: 'Village B',
        location: { type: 'Point', coordinates: [73.95, 18.55] },
      },
      serviceType: 'vehicle_and_driver',
      vehicleType: 'tractor',
      scheduledAt: TOMORROW(),
      ...overrides,
    });
  return res.body.data.id;
}
