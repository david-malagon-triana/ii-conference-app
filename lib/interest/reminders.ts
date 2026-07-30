import { DiscoveredItemRow, InterestRequestRow, Workbook, getSetting } from '../workbook/types';
import { buildReminderEmail } from '../email/templates';
import { sendSimulatedEmail } from '../email/sendEmail';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function findDueReminders(
  wb: Workbook,
  now: Date,
): { request: InterestRequestRow; item: DiscoveredItemRow }[] {
  const leadDays = Number(getSetting(wb, 'reminderLeadDays') ?? '3');
  const due: { request: InterestRequestRow; item: DiscoveredItemRow }[] = [];

  for (const request of wb.interestRequests) {
    if (request.reminderSent) continue;
    const item = wb.discoveredItems.find((i) => i.id === request.itemId);
    if (!item || !item.startDate) continue;

    const daysUntil = (new Date(item.startDate).getTime() - now.getTime()) / MS_PER_DAY;
    if (daysUntil >= 0 && daysUntil <= leadDays) {
      due.push({ request, item });
    }
  }

  return due;
}

export function sendDueReminders(wb: Workbook, now: Date): number {
  const due = findDueReminders(wb, now);

  for (const { request, item } of due) {
    const email = buildReminderEmail(item, request);
    sendSimulatedEmail(wb, request.employeeEmail, email.subject, email.body, 'REMINDER', now);
    request.reminderSent = true;
  }

  return due.length;
}
