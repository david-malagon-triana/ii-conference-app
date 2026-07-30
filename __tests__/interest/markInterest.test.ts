import { describe, it, expect } from 'vitest';
import { markInterest } from '../../lib/interest/markInterest';
import { emptyWorkbook, DiscoveredItemRow } from '../../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow>): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Fundamentals', type: 'COURSE', provider: '', url: '', description: '',
    format: 'ONLINE', location: '', startDate: null, endDate: null, duration: null, priceStatus: 'FREE',
    tier: 'FUNDAMENTALS', tierRationale: '', relevanceScore: 0, speakersCompanies: '', active: true,
    discoveredAt: '', sourceQuery: '', topicIds: '',
    ...overrides,
  };
}

describe('markInterest', () => {
  it('logs a free item with no PM fields and sends no email', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [item({ priceStatus: 'FREE' })];

    const request = markInterest(
      wb,
      { itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com' },
      new Date('2026-08-01'),
    );

    expect(request.pmNotified).toBe(false);
    expect(request.pmName).toBeNull();
    expect(request.pmEmail).toBeNull();
    expect(wb.interestRequests).toEqual([request]);
    expect(wb.sentEmails).toHaveLength(0);
  });

  it('requires PM name and email for a paid item, and sends exactly one PM notification', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [item({ priceStatus: 'PAID' })];

    const request = markInterest(
      wb,
      {
        itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com',
        pmName: 'John Smith', pmEmail: 'john@capgemini.com',
      },
      new Date('2026-08-01'),
    );

    expect(request.pmNotified).toBe(true);
    expect(request.pmName).toBe('John Smith');
    expect(request.pmNotifiedAt).toBe('2026-08-01T00:00:00.000Z');
    expect(wb.sentEmails).toHaveLength(1);
    expect(wb.sentEmails[0].kind).toBe('PM_NOTIFICATION');
  });

  it('treats UNKNOWN price the same as PAID (PM required and notified)', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [item({ priceStatus: 'UNKNOWN' })];

    const request = markInterest(
      wb,
      {
        itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com',
        pmName: 'John Smith', pmEmail: 'john@capgemini.com',
      },
      new Date('2026-08-01'),
    );

    expect(request.pmNotified).toBe(true);
    expect(wb.sentEmails).toHaveLength(1);
  });

  it('throws when a paid item is missing the PM email', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [item({ priceStatus: 'PAID' })];

    expect(() =>
      markInterest(
        wb,
        { itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com', pmName: 'John Smith' },
        new Date('2026-08-01'),
      ),
    ).toThrow(/PM name and email/);
  });

  it('throws when the item does not exist', () => {
    const wb = emptyWorkbook();
    expect(() =>
      markInterest(
        wb,
        { itemId: 'missing', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com' },
        new Date('2026-08-01'),
      ),
    ).toThrow(/not found/);
  });
});
