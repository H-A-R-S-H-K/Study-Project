import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { agent, registerUser, auth } from '../helpers.js';
import { User } from '../../src/models/index.js';

const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admin12345';

async function seedAdmin(): Promise<void> {
  await User.create({
    name: 'Admin',
    email: ADMIN_EMAIL,
    phone: '+910000000001',
    role: 'admin',
    status: 'active',
    isPhoneVerified: true,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 4),
  });
}

async function adminToken(): Promise<string> {
  const res = await agent()
    .post('/api/v1/admin/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return res.body.data.tokens.accessToken;
}

describe('admin', () => {
  beforeEach(seedAdmin);

  it('logs in with email/password and rejects bad credentials', async () => {
    const ok = await agent()
      .post('/api/v1/admin/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(ok.status).toBe(200);

    const bad = await agent()
      .post('/api/v1/admin/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'nope' });
    expect(bad.status).toBe(401);
  });

  it('forbids non-admins', async () => {
    const customer = await registerUser('customer');
    const res = await agent().get('/api/v1/admin/stats').set('Authorization', auth(customer.token));
    expect(res.status).toBe(403);
  });

  it('suspends and reactivates a user', async () => {
    const token = await adminToken();
    const owner = await registerUser('vehicle_owner');

    const suspend = await agent()
      .patch(`/api/v1/admin/users/${owner.id}/status`)
      .set('Authorization', auth(token))
      .send({ status: 'suspended' });
    expect(suspend.body.data.status).toBe('suspended');

    // Suspended user is blocked.
    const blocked = await agent()
      .get('/api/v1/vehicles')
      .set('Authorization', auth(owner.token));
    expect(blocked.status).toBe(403);

    await agent()
      .patch(`/api/v1/admin/users/${owner.id}/status`)
      .set('Authorization', auth(token))
      .send({ status: 'active' });
    const ok = await agent().get('/api/v1/vehicles').set('Authorization', auth(owner.token));
    expect(ok.status).toBe(200);
  });

  it('verifies a vehicle document and cascades to the vehicle', async () => {
    const token = await adminToken();
    const owner = await registerUser('vehicle_owner');
    const veh = await agent()
      .post('/api/v1/vehicles')
      .set('Authorization', auth(owner.token))
      .send({ type: 'tractor', title: 'Tractor', registrationNumber: 'MH12CASCADE' });
    const vehicleId = veh.body.data.id;

    // Upload a registration document (tiny PDF buffer).
    await agent()
      .post(`/api/v1/vehicles/${vehicleId}/registration`)
      .set('Authorization', auth(owner.token))
      .attach('document', Buffer.from('%PDF-1.4 test'), 'reg.pdf');

    const queue = await agent()
      .get('/api/v1/admin/documents?status=pending')
      .set('Authorization', auth(token));
    const docId = queue.body.data[0].id;

    const verify = await agent()
      .patch(`/api/v1/admin/documents/${docId}/verify`)
      .set('Authorization', auth(token))
      .send({ status: 'verified' });
    expect(verify.body.data.status).toBe('verified');

    const after = await agent()
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', auth(owner.token));
    expect(after.body.data.verifiedRegistration).toBe(true);
  });

  it('requires a reason to reject a document', async () => {
    const token = await adminToken();
    const owner = await registerUser('vehicle_owner');
    const veh = await agent()
      .post('/api/v1/vehicles')
      .set('Authorization', auth(owner.token))
      .send({ type: 'car', title: 'Car', registrationNumber: 'MH12REJECT' });
    await agent()
      .post(`/api/v1/vehicles/${veh.body.data.id}/registration`)
      .set('Authorization', auth(owner.token))
      .attach('document', Buffer.from('%PDF-1.4 test'), 'reg.pdf');
    const queue = await agent()
      .get('/api/v1/admin/documents?status=pending')
      .set('Authorization', auth(token));

    const res = await agent()
      .patch(`/api/v1/admin/documents/${queue.body.data[0].id}/verify`)
      .set('Authorization', auth(token))
      .send({ status: 'rejected' });
    expect(res.status).toBe(400);
  });
});
