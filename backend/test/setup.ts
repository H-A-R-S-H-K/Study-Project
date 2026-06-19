import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';
import { initSocket } from '../src/config/socket.js';

/**
 * Global test harness. Spins up an ephemeral in-memory MongoDB (isolated per run,
 * torn down after), connects Mongoose to it, and attaches Socket.IO to a real
 * HTTP server so services that emit realtime events have a live `io` instance.
 * Collections are wiped after every test for isolation.
 */
let mongod: MongoMemoryServer;
let server: http.Server;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('vtc_test'));

  server = http.createServer(createApp());
  initSocket(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  // Build indexes now (esp. 2dsphere) so $geoNear queries work from the first
  // test — Mongoose's automatic index build is async and would otherwise race.
  await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
