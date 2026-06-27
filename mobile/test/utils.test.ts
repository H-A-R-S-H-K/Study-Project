import { describe, it, expect } from 'vitest';
import { formatDistance } from '../src/maps/utils/format';
import { extractApiError } from '../src/utils/errors';
import { SCHEDULE_PRESETS, STATUS_LABEL } from '../src/customer/utils/requestDisplay';

describe('formatDistance', () => {
  it('shows metres under 1km and km above', () => {
    expect(formatDistance(150)).toBe('150 m');
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(6682)).toBe('6.7 km');
  });
});

describe('extractApiError', () => {
  it('surfaces the backend message shape', () => {
    const err = {
      isAxiosError: true,
      response: { data: { message: 'Incorrect code.' } },
    };
    expect(extractApiError(err)).toBe('Incorrect code.');
  });
  it('falls back for unknown errors', () => {
    expect(extractApiError(new Error('boom'))).toBe('boom');
    expect(extractApiError(null)).toBe('Something went wrong. Please try again.');
  });
});

describe('schedule presets', () => {
  it('all resolve to a future ISO time', () => {
    for (const p of SCHEDULE_PRESETS) {
      expect(new Date(p.toISO()).getTime()).toBeGreaterThan(Date.now());
    }
  });
});

describe('status labels', () => {
  it('covers every request status', () => {
    expect(STATUS_LABEL.open).toBe('Open');
    expect(STATUS_LABEL.completed).toBe('Completed');
    expect(STATUS_LABEL.cancelled).toBe('Cancelled');
  });
});
