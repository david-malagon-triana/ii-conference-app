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
    pmNotified: false, pmNotifiedAt: null, createdAt: '2026-08-01T00:00:00.000Z', reminderSent: false,
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

describe('computeReportingStats — topItems', () => {
  it('excludes items with zero interest, sorts by count desc, caps at 10', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = Array.from({ length: 12 }, (_, i) =>
      item({ id: `item-${i}`, title: `Item ${i}`, discoveredAt: '2026-08-01T00:00:00.000Z' }),
    );
    // item-0 gets 11 requests, item-1 gets 10, ..., item-10 gets 1, item-11 gets 0.
    wb.interestRequests = wb.discoveredItems.flatMap((it, i) => {
      const count = i === 11 ? 0 : 11 - i;
      return Array.from({ length: count }, (_, j) => request({ id: `r-${i}-${j}`, itemId: it.id }));
    });

    const stats = computeReportingStats(wb);

    expect(stats.topItems).toHaveLength(10);
    expect(stats.topItems[0]).toEqual({ itemId: 'item-0', title: 'Item 0', count: 11 });
    expect(stats.topItems.map((t) => t.itemId)).not.toContain('item-10'); // 11th-highest, cut by the top-10 cap
    expect(stats.topItems.map((t) => t.itemId)).not.toContain('item-11'); // zero interest, filtered before ranking
  });

  it('breaks count ties by earliest discoveredAt, then by id', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [
      item({ id: 'b', title: 'B', discoveredAt: '2026-08-02T00:00:00.000Z' }),
      item({ id: 'a', title: 'A', discoveredAt: '2026-08-01T00:00:00.000Z' }),
      item({ id: 'c', title: 'C', discoveredAt: '2026-08-01T00:00:00.000Z' }),
    ];
    wb.interestRequests = [
      request({ id: 'r1', itemId: 'b' }),
      request({ id: 'r2', itemId: 'a' }),
      request({ id: 'r3', itemId: 'c' }),
    ];

    const stats = computeReportingStats(wb);

    // all three tied at count 1: 'a' and 'c' share the earliest discoveredAt (2026-08-01),
    // so id breaks their tie ('a' < 'c'); 'b' is later (2026-08-02), so it sorts last.
    expect(stats.topItems.map((t) => t.itemId)).toEqual(['a', 'c', 'b']);
  });
});

describe('computeReportingStats — uniqueEmployeeCount', () => {
  it('deduplicates by email, case- and whitespace-insensitively', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [item({ id: '1' })];
    wb.interestRequests = [
      request({ id: 'r1', employeeEmail: 'Jane@Capgemini.com' }),
      request({ id: 'r2', employeeEmail: ' jane@capgemini.com ' }),
      request({ id: 'r3', employeeEmail: 'john@capgemini.com' }),
    ];

    const stats = computeReportingStats(wb);

    expect(stats.uniqueEmployeeCount).toBe(2);
  });
});

describe('computeReportingStats — interestTrendByWeek', () => {
  it('buckets interest requests into Monday-start weeks', () => {
    const wb = emptyWorkbook();
    wb.discoveredItems = [item({ id: '1' })];
    wb.interestRequests = [
      // Wednesday 2026-08-05 and Sunday 2026-08-09 both fall in the week starting Monday 2026-08-03
      request({ id: 'r1', createdAt: '2026-08-05T10:00:00.000Z' }),
      request({ id: 'r2', createdAt: '2026-08-09T23:59:00.000Z' }),
      // Monday 2026-08-10 starts the next week
      request({ id: 'r3', createdAt: '2026-08-10T00:00:00.000Z' }),
    ];

    const stats = computeReportingStats(wb);

    expect(stats.interestTrendByWeek).toEqual({ '2026-08-03': 2, '2026-08-10': 1 });
  });
});
