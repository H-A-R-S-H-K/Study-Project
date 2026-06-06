import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/index.js';
import { UserRole, UserStatus } from '../types/enums.js';
import { logger } from '../config/logger.js';

/**
 * Seeds an initial admin account for the dashboard. Idempotent — running it
 * again updates the password rather than creating duplicates. Credentials come
 * from env (ADMIN_EMAIL / ADMIN_PASSWORD) or fall back to dev defaults.
 *
 *   npm run seed
 */
async function seed(): Promise<void> {
  await connectDatabase();

  const email = (process.env.ADMIN_EMAIL ?? 'admin@vtc.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email, role: UserRole.ADMIN });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.status = UserStatus.ACTIVE;
    await existing.save();
    logger.info({ email }, 'Admin password reset');
  } else {
    await User.create({
      name: 'Platform Admin',
      email,
      phone: process.env.ADMIN_PHONE ?? '+910000000000',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      passwordHash,
    });
    logger.info({ email }, 'Admin account created');
  }

  // eslint-disable-next-line no-console
  console.log(`\n✅ Admin ready → email: ${email}  password: ${password}\n`);
  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  logger.fatal({ err }, 'Seed failed');
  process.exit(1);
});
