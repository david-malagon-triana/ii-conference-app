import { describe, it, expect } from 'vitest';
import { findDueReminders, sendDueReminders } from '../../lib/interest/reminders';
import { emptyWorkbook, DiscoveredItemRow, InterestRequestRow } from '../../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow>): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Summit', type: 'SEMINAR', provider: '', url: '', description: '',
    format: 'PHYSICAL', location: 'Oslo', startDate: '2026-08-04', endDate: null, duration: '1 day', priceStatus: 'FREE',
    tier: 'BASICS', tierRationale: '', relevanceScore: 0, speakersCompanies: '', active: true,
    discoveredAt: '', sourceQuery: '', topicIds: '',
    ...overrides,
  };
}

function request(overrides: Partial<InterestRequestRow>): InterestRequestRow {
  return {
    id: 'r1', itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com',
    pmName: null, pmEmail: null, pmNotified: false, pmNotifiedAt: null,
    createdAt: '2026-08-01T00:00:00.000Z', reminderSent: false,
    ...overrides,
  };
}

const now = new Date('2026-08-01T00:00:00.000Z');

describe('findDueReminders', () => {
  it('finds a request whose item starts within reminderLeadDays and has not been reminded', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'reminderLeadDays', value: '3' }];
    wb.discoveredItems = [item({ startDate: '2026-08-04' })];
    wb.interestRequests = [request({})];

    const due = findDueReminders(wb, now);
    expect(due).toHaveLength(1);
    expect(due[0].request.id).toBe('r1');
  });

  it('excludes requests already reminded', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'reminderLeadDays', value: '3' }];
    wb.discoveredItems = [item({ startDate: '2026-08-04' })];
    wb.interestRequests = [request({ reminderSent: true })];

    expect(findDueReminders(wb, now)).toHaveLength(0);
  });

  it('excludes items with no startDate', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'reminderLeadDays', value: '3' }];
    wb.discoveredItems = [item({ startDate: null })];
    wb.interestRequests = [request({})];

    expect(findDueReminders(wb, now)).toHaveLength(0);
  });

  it('excludes items too far in the future', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'reminderLeadDays', value: '3' }];
    wb.discoveredItems = [item({ startDate: '2026-09-01' })];
    wb.interestRequests = [request({})];

    expect(findDueReminders(wb, now)).toHaveLength(0);
  });

  it('excludes items already in the past', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'reminderLeadDays', value: '3' }];
    wb.discoveredItems = [item({ startDate: '2026-07-01' })];
    wb.interestRequests = [request({})];

    expect(findDueReminders(wb, now)).toHaveLength(0);
  });
});

describe('sendDueReminders', () => {
  it('sends a reminder email per due request and marks reminderSent', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'reminderLeadDays', value: '3' }];
    wb.discoveredItems = [item({ startDate: '2026-08-04' })];
    wb.interestRequests = [request({})];

    const count = sendDueReminders(wb, now);

    expect(count).toBe(1);
    expect(wb.interestRequests[0].reminderSent).toBe(true);
    expect(wb.sentEmails).toHaveLength(1);
    expect(wb.sentEmails[0].kind).toBe('REMINDER');
  });
});
