import { describe, it, expect } from 'vitest';
import { shouldRunNow } from '../../lib/discovery/scheduler';

describe('shouldRunNow', () => {
  it('returns true when never run before and the scheduled hour has arrived', () => {
    const now = new Date('2026-08-01T06:05:00.000Z');
    expect(shouldRunNow(null, 6, now)).toBe(true);
  });

  it('returns false when already run today', () => {
    const lastRun = new Date('2026-08-01T06:05:00.000Z');
    const now = new Date('2026-08-01T07:00:00.000Z');
    expect(shouldRunNow(lastRun, 6, now)).toBe(false);
  });

  it('returns true the next day after the scheduled hour', () => {
    const lastRun = new Date('2026-08-01T06:05:00.000Z');
    const now = new Date('2026-08-02T06:05:00.000Z');
    expect(shouldRunNow(lastRun, 6, now)).toBe(true);
  });

  it('returns false before the scheduled hour has arrived today', () => {
    const now = new Date('2026-08-01T05:00:00.000Z');
    expect(shouldRunNow(null, 6, now)).toBe(false);
  });
});
