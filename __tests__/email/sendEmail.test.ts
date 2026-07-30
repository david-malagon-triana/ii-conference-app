import { describe, it, expect } from 'vitest';
import { buildPmNotificationEmail, buildReminderEmail, buildSystemAlertEmail } from '../../lib/email/templates';
import { sendSimulatedEmail } from '../../lib/email/sendEmail';
import { emptyWorkbook, DiscoveredItemRow, InterestRequestRow, TopicRow } from '../../lib/workbook/types';

const item: DiscoveredItemRow = {
  id: '1', title: 'Data Foundation Summit Nordics', type: 'SEMINAR', provider: '', url: 'https://x.com',
  description: '', format: 'PHYSICAL', location: 'Oslo', startDate: '2026-10-03', endDate: '2026-10-04',
  duration: '2 days', priceStatus: 'PAID', tier: 'ADVANCED', tierRationale: '', relevanceScore: 0.8, speakersCompanies: '',
  active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
};

const request: InterestRequestRow = {
  id: 'r1', itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com',
  pmName: 'John Smith', pmEmail: 'john@capgemini.com', pmNotified: true, pmNotifiedAt: null,
  createdAt: '2026-08-01T00:00:00.000Z', reminderSent: false,
};

describe('email templates', () => {
  it('builds a PM notification mentioning the employee, PM, and event', () => {
    const email = buildPmNotificationEmail(item, request);
    expect(email.subject).toContain('Data Foundation Summit Nordics');
    expect(email.body).toContain('Jane Doe');
    expect(email.body).toContain('John Smith');
    expect(email.body).toContain('Oslo');
  });

  it('builds a reminder addressed to the employee', () => {
    const email = buildReminderEmail(item, request);
    expect(email.body).toContain('Jane Doe');
    expect(email.body).toContain('2026-10-03');
  });

  it('builds a system alert naming the topic and error', () => {
    const topic: TopicRow = { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: '' };
    const email = buildSystemAlertEmail(topic, 'API down');
    expect(email.subject).toContain('Data Strategy');
    expect(email.body).toContain('API down');
  });
});

describe('sendSimulatedEmail', () => {
  it('appends a SentEmailRow to the workbook and returns it', () => {
    const wb = emptyWorkbook();
    const row = sendSimulatedEmail(wb, 'to@x.com', 'Subject', 'Body', 'PM_NOTIFICATION', new Date('2026-08-01'));
    expect(wb.sentEmails).toHaveLength(1);
    expect(wb.sentEmails[0]).toEqual(row);
    expect(row.to).toBe('to@x.com');
    expect(row.kind).toBe('PM_NOTIFICATION');
    expect(row.sentAt).toBe('2026-08-01T00:00:00.000Z');
  });
});
