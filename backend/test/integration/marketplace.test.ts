import { describe, it, expect } from 'vitest';
import { agent, registerUser, createRequest, auth } from '../helpers.js';

async function ownerWithVehicle(): Promise<{ token: string; id: string; vehicleId: string }> {
  const owner = await registerUser('vehicle_owner', 'Owner');
  const veh = await agent()
    .post('/api/v1/vehicles')
    .set('Authorization', auth(owner.token))
    .send({ type: 'tractor', title: 'T1', registrationNumber: `MH${Date.now() % 100000}` });
  return { token: owner.token, id: owner.id, vehicleId: veh.body.data.id };
}

describe('requests + offers marketplace', () => {
  it('runs the full happy path: request → offer → accept → complete → rate', async () => {
    const customer = await registerUser('customer', 'Cust');
    const owner = await ownerWithVehicle();

    const requestId = await createRequest(customer.token);

    const offer = await agent()
      .post(`/api/v1/requests/${requestId}/offers`)
      .set('Authorization', auth(owner.token))
      .send({ price: 800, vehicleId: owner.vehicleId, message: '20 min away' });
    expect(offer.status).toBe(201);
    expect(offer.body.data.price).toBe(800);

    const accept = await agent()
      .post(`/api/v1/requests/${requestId}/offers/${offer.body.data.id}/accept`)
      .set('Authorization', auth(customer.token));
    expect(accept.status).toBe(200);
    expect(accept.body.data.request.status).toBe('matched');
    expect(accept.body.data.chatId).toBeTruthy();

    const complete = await agent()
      .post(`/api/v1/requests/${requestId}/complete`)
      .set('Authorization', auth(owner.token));
    expect(complete.body.data.status).toBe('completed');

    const rate = await agent()
      .post(`/api/v1/requests/${requestId}/ratings`)
      .set('Authorization', auth(customer.token))
      .send({ score: 5, review: 'Great' });
    expect(rate.status).toBe(201);

    const profile = await agent()
      .get(`/api/v1/users/${owner.id}`)
      .set('Authorization', auth(customer.token));
    expect(profile.body.data.ratingSummary).toMatchObject({ average: 5, count: 1 });
  });

  it('auto-rejects other offers on accept and blocks a second accept', async () => {
    const customer = await registerUser('customer');
    const o1 = await ownerWithVehicle();
    const o2 = await ownerWithVehicle();
    const requestId = await createRequest(customer.token);

    const offer1 = await agent()
      .post(`/api/v1/requests/${requestId}/offers`)
      .set('Authorization', auth(o1.token))
      .send({ price: 700, vehicleId: o1.vehicleId });
    const offer2 = await agent()
      .post(`/api/v1/requests/${requestId}/offers`)
      .set('Authorization', auth(o2.token))
      .send({ price: 650, vehicleId: o2.vehicleId });

    await agent()
      .post(`/api/v1/requests/${requestId}/offers/${offer1.body.data.id}/accept`)
      .set('Authorization', auth(customer.token));

    const offers = await agent()
      .get(`/api/v1/requests/${requestId}/offers`)
      .set('Authorization', auth(customer.token));
    const byId = Object.fromEntries(offers.body.data.map((o: { id: string; status: string }) => [o.id, o.status]));
    expect(byId[offer1.body.data.id]).toBe('accepted');
    expect(byId[offer2.body.data.id]).toBe('rejected');

    const secondAccept = await agent()
      .post(`/api/v1/requests/${requestId}/offers/${offer2.body.data.id}/accept`)
      .set('Authorization', auth(customer.token));
    expect(secondAccept.status).toBe(409);
  });

  it('enforces role and ownership rules', async () => {
    const customer = await registerUser('customer');
    const driver = await registerUser('driver');

    // Customer cannot create a vehicle.
    const veh = await agent()
      .post('/api/v1/vehicles')
      .set('Authorization', auth(customer.token))
      .send({ type: 'car', title: 'x', registrationNumber: 'MH00X0001' });
    expect(veh.status).toBe(403);

    // Driver cannot offer on a vehicle_and_driver request.
    const requestId = await createRequest(customer.token);
    const offer = await agent()
      .post(`/api/v1/requests/${requestId}/offers`)
      .set('Authorization', auth(driver.token))
      .send({ price: 500 });
    expect(offer.status).toBe(403);
  });

  it('rejects rating before completion and duplicate ratings', async () => {
    const customer = await registerUser('customer');
    const owner = await ownerWithVehicle();
    const requestId = await createRequest(customer.token);
    const offer = await agent()
      .post(`/api/v1/requests/${requestId}/offers`)
      .set('Authorization', auth(owner.token))
      .send({ price: 800, vehicleId: owner.vehicleId });
    await agent()
      .post(`/api/v1/requests/${requestId}/offers/${offer.body.data.id}/accept`)
      .set('Authorization', auth(customer.token));

    const early = await agent()
      .post(`/api/v1/requests/${requestId}/ratings`)
      .set('Authorization', auth(customer.token))
      .send({ score: 5 });
    expect(early.status).toBe(409);

    await agent()
      .post(`/api/v1/requests/${requestId}/complete`)
      .set('Authorization', auth(customer.token));
    await agent()
      .post(`/api/v1/requests/${requestId}/ratings`)
      .set('Authorization', auth(customer.token))
      .send({ score: 4 });
    const dup = await agent()
      .post(`/api/v1/requests/${requestId}/ratings`)
      .set('Authorization', auth(customer.token))
      .send({ score: 3 });
    expect(dup.status).toBe(409);
  });
});
