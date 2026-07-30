import { describe, it, expect } from 'vitest';
import { filterByDateRange } from '../lib/dateFilter';
import { DiscoveredItemRow } from '../lib/workbook/types';

function item(startDate: string | null): DiscoveredItemRow {
  return {
    id: '1', title: 'x', type: 'EVENT', provider: '', url: '', description: '', format: 'ONLINE',
    location: '', startDate, endDate: null, duration: null, priceStatus: 'FREE', tier: 'BASICS', tierRationale: '',
    relevanceScore: 0, speakersCompanies: '', active: true, discoveredAt: '', sourceQuery: '', topicIds: '',
  };
}

describe('filterByDateRange', () => {
  it('returns all items unchanged when no range is given', () => {
    const items = [item('2026-09-01'), item(null)];
    expect(filterByDateRange(items, null, null)).toEqual(items);
  });

  it('excludes items with a null startDate when a range is given', () => {
    const items = [item('2026-09-01'), item(null)];
    const result = filterByDateRange(items, new Date('2026-08-01'), new Date('2026-10-01'));
    expect(result).toEqual([items[0]]);
  });

  it('excludes items whose startDate falls outside the range', () => {
    const items = [item('2026-09-01'), item('2027-01-01')];
    const result = filterByDateRange(items, new Date('2026-08-01'), new Date('2026-10-01'));
    expect(result).toEqual([items[0]]);
  });
});
