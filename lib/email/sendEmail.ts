import { randomUUID } from 'crypto';
import { EmailKind, SentEmailRow, Workbook } from '../workbook/types';

export function sendSimulatedEmail(
  wb: Workbook,
  to: string,
  subject: string,
  body: string,
  kind: EmailKind,
  now: Date,
): SentEmailRow {
  const row: SentEmailRow = {
    id: randomUUID(),
    to,
    subject,
    body,
    sentAt: now.toISOString(),
    kind,
  };
  wb.sentEmails.push(row);
  return row;
}
