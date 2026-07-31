import { describe, it, expect } from 'vitest';
import { shouldRunNow, parseScheduleHourUtc, parseLastRunAt } from '../../lib/discovery/scheduler';

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

describe('parseScheduleHourUtc', () => {
  it('reads the hour out of the seeded cron expression', () => {
    expect(parseScheduleHourUtc('0 6 * * *')).toBe(6);
    expect(parseScheduleHourUtc('30 21 * * *')).toBe(21);
  });

  it('accepts a plain clock time', () => {
    expect(parseScheduleHourUtc('06:00')).toBe(6);
    expect(parseScheduleHourUtc('9')).toBe(9);
    expect(parseScheduleHourUtc('23:45')).toBe(23);
  });

  it('falls back to 06:00 for missing or unparseable values', () => {
    expect(parseScheduleHourUtc(undefined)).toBe(6);
    expect(parseScheduleHourUtc(null)).toBe(6);
    expect(parseScheduleHourUtc('')).toBe(6);
    expect(parseScheduleHourUtc('   ')).toBe(6);
    expect(parseScheduleHourUtc('every morning please')).toBe(6);
    expect(parseScheduleHourUtc('0 99 * * *')).toBe(6);
  });

  it('does not treat a stored setting as the hardcoded default when it differs', () => {
    // The whole point of finding 6: a changed setting must actually change the schedule.
    expect(parseScheduleHourUtc('0 14 * * *')).not.toBe(6);
    expect(parseScheduleHourUtc('0 14 * * *')).toBe(14);
  });
});

describe('parseLastRunAt', () => {
  it('parses a persisted ISO timestamp', () => {
    expect(parseLastRunAt('2026-08-01T06:05:00.000Z')?.toISOString()).toBe('2026-08-01T06:05:00.000Z');
  });

  it('treats blank or invalid stored values as never run', () => {
    expect(parseLastRunAt('')).toBeNull();
    expect(parseLastRunAt(undefined)).toBeNull();
    expect(parseLastRunAt('not a date')).toBeNull();
  });
});
