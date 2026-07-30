import { describe, it, expect } from 'vitest';
import { isDuplicate } from '../../lib/discovery/dedupe';
import { DiscoveredItemRow } from '../../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow>): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Summit 2026', type: 'SEMINAR', provider: '', url: 'https://example.com/gen-ai-summit',
    description: '', format: 'PHYSICAL', location: '', startDate: null, endDate: null, duration: null,
    priceStatus: 'UNKNOWN', tier: 'BASICS', tierRationale: '', relevanceScore: 0.5,
    speakersCompanies: '', active: true, discoveredAt: '', sourceQuery: '', topicIds: '',
    ...overrides,
  };
}

describe('isDuplicate', () => {
  it('flags an exact URL match as duplicate', () => {
    const existing = [item({})];
    expect(isDuplicate({ title: 'Different title', url: 'https://example.com/gen-ai-summit' }, existing)).toBe(true);
  });

  it('flags a near-identical normalized title as duplicate even with a different URL', () => {
    const existing = [item({})];
    expect(isDuplicate({ title: '  GEN AI SUMMIT 2026!! ', url: 'https://example.com/other-link' }, existing)).toBe(true);
  });

  it('does not flag a genuinely different item', () => {
    const existing = [item({})];
    expect(isDuplicate({ title: 'Data Visualization 101', url: 'https://example.com/dataviz-101' }, existing)).toBe(false);
  });
});
