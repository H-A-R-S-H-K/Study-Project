import { describe, it, expect } from 'vitest';
import { durationToMs } from '../../src/utils/duration.js';
import { parsePagination, buildPaginationMeta } from '../../src/utils/pagination.js';
import { generateOtp, sha256 } from '../../src/utils/crypto.js';

describe('durationToMs', () => {
  it('parses units', () => {
    expect(durationToMs('15m')).toBe(900_000);
    expect(durationToMs('1h')).toBe(3_600_000);
    expect(durationToMs('30d')).toBe(2_592_000_000);
    expect(durationToMs('2w')).toBe(1_209_600_000);
  });
  it('rejects garbage', () => {
    expect(() => durationToMs('nope')).toThrow();
    expect(() => durationToMs('10')).toThrow();
  });
});

describe('parsePagination', () => {
  it('applies safe defaults', () => {
    const p = parsePagination({});
    expect(p).toMatchObject({ page: 1, limit: 20, skip: 0 });
    expect(p.sort).toEqual({ createdAt: -1 });
  });
  it('clamps limit and computes skip', () => {
    expect(parsePagination({ limit: '999' }).limit).toBe(100);
    expect(parsePagination({ page: '3', limit: '10' }).skip).toBe(20);
  });
  it('parses sort direction from - prefix', () => {
    expect(parsePagination({ sort: '-price,name' }).sort).toEqual({ price: -1, name: 1 });
  });
});

describe('buildPaginationMeta', () => {
  it('derives page flags', () => {
    const meta = buildPaginationMeta(45, 2, 20);
    expect(meta).toMatchObject({ total: 45, totalPages: 3, hasNext: true, hasPrev: true });
  });
});

describe('crypto', () => {
  it('generates OTP of the requested length', () => {
    expect(generateOtp(6)).toMatch(/^\d{6}$/);
    expect(generateOtp(4)).toMatch(/^\d{4}$/);
  });
  it('hashes deterministically', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });
});
