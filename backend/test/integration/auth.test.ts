import { describe, it, expect } from 'vitest';
import { agent, registerUser, auth } from '../helpers.js';

describe('auth flow', () => {
  it('registers a new phone and logs in an existing one', async () => {
    const phone = '+919812345001';
    const otp = await agent().post('/api/v1/auth/otp/request').send({ phone });
    const code = otp.body.data.devCode;
    const verify = await agent().post('/api/v1/auth/otp/verify').send({ phone, code });
    expect(verify.body.data.isNewUser).toBe(true);

    const reg = await agent().post('/api/v1/auth/register').send({
      registrationToken: verify.body.data.registrationToken,
      name: 'Ramesh',
      role: 'customer',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.data.user.role).toBe('customer');

    // Same phone again → existing-user login with tokens.
    const otp2 = await agent().post('/api/v1/auth/otp/request').send({ phone });
    const verify2 = await agent()
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: otp2.body.data.devCode });
    expect(verify2.body.data.isNewUser).toBe(false);
    expect(verify2.body.data.tokens.accessToken).toBeTruthy();
  });

  it('rejects a wrong OTP and a bad phone', async () => {
    const phone = '+919812345002';
    await agent().post('/api/v1/auth/otp/request').send({ phone });
    const bad = await agent().post('/api/v1/auth/otp/verify').send({ phone, code: '000000' });
    expect(bad.status).toBe(400);

    const badPhone = await agent().post('/api/v1/auth/otp/request').send({ phone: 'abc' });
    expect(badPhone.status).toBe(400);
  });

  it('blocks admin self-registration', async () => {
    const phone = '+919812345003';
    const otp = await agent().post('/api/v1/auth/otp/request').send({ phone });
    const verify = await agent()
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: otp.body.data.devCode });
    const res = await agent().post('/api/v1/auth/register').send({
      registrationToken: verify.body.data.registrationToken,
      name: 'Sneaky',
      role: 'admin',
    });
    expect(res.status).toBe(400);
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const user = await registerUser('customer');
    const refreshed = await agent()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: user.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.refreshToken).not.toBe(user.refreshToken);

    // Reusing the rotated token is rejected.
    const reuse = await agent()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: user.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('guards /me', async () => {
    const anon = await agent().get('/api/v1/auth/me');
    expect(anon.status).toBe(401);

    const user = await registerUser('driver', 'Suresh');
    const me = await agent().get('/api/v1/auth/me').set('Authorization', auth(user.token));
    expect(me.body.data.name).toBe('Suresh');
  });
});
