import { randomUUID } from 'crypto';
import { InterestRequestRow, Workbook } from '../workbook/types';
import { buildPmNotificationEmail } from '../email/templates';
import { sendSimulatedEmail } from '../email/sendEmail';

export interface MarkInterestInput {
  itemId: string;
  employeeName: string;
  employeeEmail: string;
  pmName?: string;
  pmEmail?: string;
}

export function markInterest(wb: Workbook, input: MarkInterestInput, now: Date): InterestRequestRow {
  const item = wb.discoveredItems.find((i) => i.id === input.itemId);
  if (!item) {
    throw new Error(`DiscoveredItem not found: ${input.itemId}`);
  }
  if (!input.employeeName || !input.employeeEmail) {
    throw new Error('Employee name and email are required');
  }

  const requiresPm = item.priceStatus !== 'FREE';
  if (requiresPm && (!input.pmName || !input.pmEmail)) {
    throw new Error('PM name and email are required for paid or unknown-price items');
  }

  const request: InterestRequestRow = {
    id: randomUUID(),
    itemId: item.id,
    employeeName: input.employeeName,
    employeeEmail: input.employeeEmail,
    pmName: requiresPm ? input.pmName! : null,
    pmEmail: requiresPm ? input.pmEmail! : null,
    pmNotified: requiresPm,
    pmNotifiedAt: requiresPm ? now.toISOString() : null,
    createdAt: now.toISOString(),
    reminderSent: false,
  };

  wb.interestRequests.push(request);

  if (requiresPm) {
    const email = buildPmNotificationEmail(item, request);
    sendSimulatedEmail(wb, request.pmEmail!, email.subject, email.body, 'PM_NOTIFICATION', now);
  }

  return request;
}
