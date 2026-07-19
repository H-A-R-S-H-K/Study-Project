import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
  User,
  Vehicle,
  Driver,
  Request,
  Offer,
  Chat,
  Message,
  Rating,
  Notification,
  DocumentModel,
  RefreshToken,
} from '../models/index.js';
import { Otp } from '../models/Otp.model.js';
import { UserRole, UserStatus, VehicleType } from '../types/enums.js';
import { logger } from '../config/logger.js';

/**
 * Wipes everything and seeds a small, clean demo around Bidhnu village, Kanpur:
 * one admin, one customer, and five providers in the surrounding rural area —
 * all login-able by phone (OTP). Run with:  npx tsx src/jobs/seed-demo.ts
 */

// Bidhnu village, Kanpur (rural). [lng, lat]
const CENTER: [number, number] = [80.2739, 26.3213];
const at = (dLng: number, dLat: number): { type: 'Point'; coordinates: [number, number] } => ({
  type: 'Point',
  coordinates: [CENTER[0] + dLng, CENTER[1] + dLat],
});

async function run(): Promise<void> {
  await connectDatabase();

  // 1. Wipe all collections.
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Request.deleteMany({}),
    Offer.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Rating.deleteMany({}),
    Notification.deleteMany({}),
    DocumentModel.deleteMany({}),
    RefreshToken.deleteMany({}),
    Otp.deleteMany({}),
  ]);
  logger.info('Wiped all collections');

  // 2. Admin.
  await User.create({
    name: 'Platform Admin',
    email: 'admin@vtc.local',
    phone: '+910000000000',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isPhoneVerified: true,
    passwordHash: await bcrypt.hash('admin12345', 12),
  });

  // 3. Customer (at Bidhnu).
  await User.create({
    name: 'Ravi Kumar',
    phone: '+919000000001',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    isPhoneVerified: true,
    location: at(0, 0),
    homeAddress: 'Bidhnu, Kanpur',
  });

  // 4. Providers around Bidhnu. Vehicle owners get an available vehicle; the
  //    driver gets a profile — each with a rural location within ~6 km.
  const owners: {
    name: string;
    phone: string;
    type: VehicleType;
    reg: string;
    loc: { type: 'Point'; coordinates: [number, number] };
  }[] = [
    { name: 'Ramesh Yadav', phone: '+919000000011', type: VehicleType.TRACTOR, reg: 'UP78AT0011', loc: at(0.016, 0.019) },
    { name: 'Suresh Verma', phone: '+919000000012', type: VehicleType.CAR, reg: 'UP78AT0012', loc: at(-0.014, -0.016) },
    { name: 'Mahesh Singh', phone: '+919000000013', type: VehicleType.AUTO, reg: 'UP78AT0013', loc: at(0.026, -0.011) },
    { name: 'Dinesh Pal', phone: '+919000000014', type: VehicleType.PICKUP, reg: 'UP78AT0014', loc: at(-0.024, 0.009) },
  ];

  for (const o of owners) {
    const user = await User.create({
      name: o.name,
      phone: o.phone,
      role: UserRole.VEHICLE_OWNER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      location: o.loc,
    });
    await Vehicle.create({
      owner: user._id,
      type: o.type,
      title: `${o.name.split(' ')[0]}'s ${o.type}`,
      registrationNumber: o.reg,
      isAvailable: true,
      isActive: true,
      location: o.loc,
    });
  }

  // The driver.
  const driverUser = await User.create({
    name: 'Anil Sharma',
    phone: '+919000000015',
    role: UserRole.DRIVER,
    status: UserStatus.ACTIVE,
    isPhoneVerified: true,
    location: at(0.006, 0.004),
  });
  await Driver.create({
    user: driverUser._id,
    licenseNumber: 'UP78DL0015',
    experienceYears: 9,
    vehicleCategories: [VehicleType.CAR, VehicleType.TRACTOR, VehicleType.AUTO],
    isAvailable: true,
    location: at(0.006, 0.004),
  });

  // Ensure geo (2dsphere) and other indexes exist for nearby queries.
  await Promise.all([User.syncIndexes(), Vehicle.syncIndexes(), Driver.syncIndexes()]);

  // eslint-disable-next-line no-console
  console.log(`
✅ Demo seeded around Bidhnu village, Kanpur (${CENTER[1]}, ${CENTER[0]})

  CUSTOMER   Ravi Kumar        +919000000001
  PROVIDERS
   • Ramesh Yadav (tractor)    +919000000011
   • Suresh Verma (car)        +919000000012
   • Mahesh Singh (auto)       +919000000013
   • Dinesh Pal  (pickup)      +919000000014
   • Anil Sharma (driver)      +919000000015
  ADMIN      admin@vtc.local / admin12345

  All login by phone → OTP (dev code shows in-app).
`);

  await disconnectDatabase();
  process.exit(0);
}

run().catch((err) => {
  logger.fatal({ err }, 'Demo seed failed');
  process.exit(1);
});
