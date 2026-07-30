import { describe, it, expect } from 'vitest';
import { computeReportingStats } from '../lib/reporting';
import { emptyWorkbook, DiscoveredItemRow, InterestRequestRow } from '../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow>): DiscoveredItemRow {
  return {
    id: '1', title: 'x', type: 'EVENT', provider: '', url: '', description: '', format: 'ONLINE',
    location: '', startDate: null, endDate: null, duration: null, priceStatus: 'FREE', tier: 'BASICS', tierRationale: '',
    relevanceScore: 0, speakersCompanies: '', active: true, discoveredAt: '2026-08-01T00:00:00.000Z',
    sourceQuery: '', topicIds: 't1',
    ...overrides,
  };
}

function request(overrides: Partial<InterestRequestRow>): InterestRequestRow {
  return {
    id: 'r1', itemId: '1', employeeName: 'Jane', employeeEmail: 'jane@x.com', pmName: null, pmEmail: null,
    pmNotified: false, pmNotifiedAt: null, createdAt: '', reminderSent: false,
    ...overrides,
  };
}

describe('computeReportingStats', () => {
  it('counts interest by topic, price split, tier distribution, PM-notified count, and catalog growth', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [
      item({ id: '1', topicIds: 't1', priceStatus: 'FREE', tier: 'FUNDAMENTALS', discoveredAt: '2026-08-01T00:00:00.000Z' }),
      item({ id: '2', topicIds: 't2', priceStatus: 'PAID', tier: 'EXPERT', discoveredAt: '2026-08-01T00:00:00.000Z' }),
      item({ id: '3', topicIds: 't1', priceStatus: 'UNKNOWN', tier: 'BASICS', discoveredAt: '2026-08-02T00:00:00.000Z' }),
    ];
    wb.interestRequests = [
      request({ id: 'r1', itemId: '1', pmNotified: false }),
      request({ id: 'r2', itemId: '2', pmNotified: true }),
    ];

    const stats = computeReportingStats(wb);

    expect(stats.interestByTopic).toEqual({ t1: 1, t2: 1 });
    expect(stats.priceSplit).toEqual({ FREE: 1, PAID: 1, UNKNOWN: 1 });
    expect(stats.tierDistribution).toEqual({ FUNDAMENTALS: 1, BASICS: 1, ADVANCED: 0, EXPERT: 1 });
    expect(stats.pmNotifiedCount).toBe(1);
    expect(stats.catalogGrowthByDay).toEqual({ '2026-08-01': 2, '2026-08-02': 1 });
  });
});
