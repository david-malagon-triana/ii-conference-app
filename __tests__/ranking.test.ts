import { describe, it, expect } from 'vitest';
import { topPicksByTopic } from '../lib/ranking';
import { DiscoveredItemRow, TopicRow } from '../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow>): DiscoveredItemRow {
  return {
    id: overrides.id ?? '1', title: 'x', type: 'EVENT', provider: '', url: `https://x/${overrides.id}`,
    description: '', format: 'ONLINE', location: '', startDate: null, endDate: null, duration: null,
    priceStatus: 'FREE', tier: 'BASICS', tierRationale: '', relevanceScore: 0,
    speakersCompanies: '', active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
    ...overrides,
  };
}

const topics: TopicRow[] = [
  { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: '' },
  { id: 't2', name: 'Smart Assets', category: 'Smart Assets', keywords: '' },
];

describe('topPicksByTopic', () => {
  it('returns the top 3 items per topic by relevanceScore, in topic order', () => {
    const items = [
      item({ id: '1', topicIds: 't1', relevanceScore: 0.9 }),
      item({ id: '2', topicIds: 't1', relevanceScore: 0.5 }),
      item({ id: '3', topicIds: 't1', relevanceScore: 0.7 }),
      item({ id: '4', topicIds: 't1', relevanceScore: 0.1 }),
    ];
    const result = topPicksByTopic(items, [topics[0]], 3);
    expect(result).toHaveLength(1);
    expect(result[0].items.map((i) => i.id)).toEqual(['1', '3', '2']);
  });

  it('omits topics with zero active items', () => {
    const items = [item({ id: '1', topicIds: 't1', active: false })];
    const result = topPicksByTopic(items, topics, 3);
    expect(result).toHaveLength(0);
  });

  it('preserves the given topic order', () => {
    const items = [item({ id: '1', topicIds: 't2' }), item({ id: '2', topicIds: 't1' })];
    const result = topPicksByTopic(items, topics, 3);
    expect(result.map((r) => r.topic.id)).toEqual(['t1', 't2']);
  });
});
