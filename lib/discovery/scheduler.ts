import { withWorkbook } from '../workbook/store';
import { getWorkbookPath } from '../workbookPath';
import { runDailyDiscovery } from './runDiscovery';
import { searchGoogle } from './googleSearchProvider';
import { sendSimulatedEmail } from '../email/sendEmail';
import { buildSystemAlertEmail } from '../email/templates';
import { getSetting } from '../workbook/types';

export function shouldRunNow(lastRunAt: Date | null, scheduleHourUtc: number, now: Date): boolean {
  if (now.getUTCHours() < scheduleHourUtc) return false;
  if (!lastRunAt) return true;
  return now.toDateString() !== lastRunAt.toDateString();
}

let lastRunAt: Date | null = null;

export async function runScheduledDiscoveryIfDue(now: Date = new Date()): Promise<void> {
  const scheduleHourUtc = 6; // matches Settings.discoveryScheduleTime default of 06:00 Europe/Oslo, approximated in UTC
  if (!shouldRunNow(lastRunAt, scheduleHourUtc, now)) return;

  await withWorkbook(getWorkbookPath(), async (wb) => {
    const apiKey = process.env.GOOGLE_CSE_API_KEY ?? '';
    const cseId = process.env.GOOGLE_CSE_ID ?? '';
    const { alerts } = await runDailyDiscovery(wb, (topic) => searchGoogle(topic, { apiKey, cseId }), now);

    const alertEmail = getSetting(wb, 'systemAlertEmail');
    if (alertEmail) {
      for (const { topic, error } of alerts) {
        const email = buildSystemAlertEmail(topic, error);
        sendSimulatedEmail(wb, alertEmail, email.subject, email.body, 'SYSTEM_ALERT', now);
      }
    }
  });

  lastRunAt = now;
}

export function startDailyScheduler(): void {
  setInterval(() => {
    runScheduledDiscoveryIfDue().catch((err) => console.error('Scheduled discovery run failed:', err));
  }, 60_000);
}
