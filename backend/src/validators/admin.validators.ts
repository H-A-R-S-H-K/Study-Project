import { z } from 'zod';
import { UserStatus, VerificationStatus } from '../types/enums.js';

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const listUsersQuery = z.object({
  search: z.string().trim().max(80).optional(),
  role: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const setUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED]),
});

export const verifyDocumentSchema = z
  .object({
    status: z.enum([VerificationStatus.VERIFIED, VerificationStatus.REJECTED]),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.status !== VerificationStatus.REJECTED || v.reason, {
    message: 'A reason is required when rejecting',
    path: ['reason'],
  });

export const idParams = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id'),
});

export const listQuery = z.object({
  status: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
