import { describe, it, expect } from 'vitest';
import { queryCatalog } from '../lib/catalogQuery';
import { DiscoveredItemRow } from '../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow>): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Fundamentals', type: 'COURSE', provider: '', url: '',
    description: 'An introduction to Gen AI', format: 'ONLINE', location: '', startDate: '2026-09-01',
    endDate: null, duration: null, priceStatus: 'FREE', tier: 'FUNDAMENTALS', tierRationale: '', relevanceScore: 0.8,
    speakersCompanies: '', active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
    ...overrides,
  };
}

describe('queryCatalog', () => {
  const items = [
    item({ id: '1', title: 'Gen AI Fundamentals', tier: 'FUNDAMENTALS', format: 'ONLINE', type: 'COURSE', topicIds: 't1' }),
    item({ id: '2', title: 'Supply Chain Summit', startDate: '2026-11-01', tier: 'EXPERT', format: 'PHYSICAL', type: 'SEMINAR', topicIds: 't2' }),
    item({ id: '3', title: 'Hidden item', active: false }),
  ];

  it('excludes inactive items always', () => {
    const result = queryCatalog(items, {});
    expect(result.map((i) => i.id)).not.toContain('3');
  });

  it('filters by free-text search across title and description', () => {
    const result = queryCatalog(items, { search: 'supply chain' });
    expect(result.map((i) => i.id)).toEqual(['2']);
  });

  it('filters by topic, tier, format, and type together', () => {
    const result = queryCatalog(items, { topicId: 't1', tier: 'FUNDAMENTALS', format: 'ONLINE', type: 'COURSE' });
    expect(result.map((i) => i.id)).toEqual(['1']);
  });

  it('applies the date range filter', () => {
    const result = queryCatalog(items, { dateFrom: new Date('2026-08-01'), dateTo: new Date('2026-10-01') });
    expect(result.map((i) => i.id)).toEqual(['1']);
  });
});
