import { loadWorkbook } from '../workbook/store';
import { getWorkbookPath } from '../workbookPath';
import { getSetting } from '../workbook/types';
import { LAST_RUN_SETTING, runDiscoveryAndAlert } from './discoveryJob';

export const DEFAULT_SCHEDULE_HOUR_UTC = 6;

export function shouldRunNow(lastRunAt: Date | null, scheduleHourUtc: number, now: Date): boolean {
  if (now.getUTCHours() < scheduleHourUtc) return false;
  if (!lastRunAt) return true;
  return now.toDateString() !== lastRunAt.toDateString();
}

/**
 * Reads the hour out of `Settings.discoveryScheduleTime`. Accepts either the seeded cron form
 * (`"0 6 * * *"`) or a plain `"06:00"` / `"6"`, and falls back to 06:00 for anything unparseable.
 *
 * As before, the hour is compared against UTC — the setting is nominally Europe/Oslo, so this is
 * an approximation (off by the Oslo UTC offset), kept deliberately simple for an in-process
 * scheduler that a real Azure Timer Trigger replaces at deploy time (design spec §11).
 */
export function parseScheduleHourUtc(
  value: string | null | undefined,
  fallback: number = DEFAULT_SCHEDULE_HOUR_UTC,
): number {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  const inRange = (n: number) => (Number.isInteger(n) && n >= 0 && n <= 23 ? n : null);

  // Cron: minute then hour, e.g. "0 6 * * *"
  const cron = /^\S+\s+(\d{1,2})(\s|$)/.exec(trimmed);
  if (cron) {
    const hour = inRange(Number(cron[1]));
    if (hour !== null) return hour;
  }

  // Plain clock time: "6", "06", "06:00"
  const clock = /^(\d{1,2})(?::\d{2})?$/.exec(trimmed);
  if (clock) {
    const hour = inRange(Number(clock[1]));
    if (hour !== null) return hour;
  }

  return fallback;
}

export function parseLastRunAt(value: string | null | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function runScheduledDiscoveryIfDue(now: Date = new Date()): Promise<void> {
  // Cheap read outside the write lock: decides whether a run is due at all.
  const wb = await loadWorkbook(getWorkbookPath());
  const scheduleHourUtc = parseScheduleHourUtc(getSetting(wb, 'discoveryScheduleTime'));
  const lastRunAt = parseLastRunAt(getSetting(wb, LAST_RUN_SETTING));

  if (!shouldRunNow(lastRunAt, scheduleHourUtc, now)) return;

  await runDiscoveryAndAlert(now);
}

export function startDailyScheduler(): void {
  setInterval(() => {
    runScheduledDiscoveryIfDue().catch((err) => console.error('Scheduled discovery run failed:', err));
  }, 60_000);
}
