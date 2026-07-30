import { describe, it, expect } from 'vitest';
import { runDiscoveryForTopic, runDailyDiscovery } from '../../lib/discovery/runDiscovery';
import { emptyWorkbook, TopicRow, DiscoveredItemRow } from '../../lib/workbook/types';
import { RawResult } from '../../lib/discovery/classifier';

const topic: TopicRow = { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI Strategy' };

describe('runDiscoveryForTopic', () => {
  it('classifies, dedupes against existing items, and returns new items plus a SUCCESS run', async () => {
    const existing: DiscoveredItemRow[] = [];
    const searchFn = async (): Promise<RawResult[]> => [
      { title: 'Gen AI Strategy fundamentals', url: 'https://example.com/1', snippet: 'Free introduction to Gen AI' },
      { title: 'Gen AI Strategy masterclass', url: 'https://example.com/2', snippet: 'Advanced Gen AI Strategy, fee: 500 EUR' },
    ];

    const { newItems, searchRun } = await runDiscoveryForTopic(topic, existing, searchFn, new Date('2026-08-01'));

    expect(newItems).toHaveLength(2);
    expect(newItems[0].topicIds).toBe('t1');
    expect(newItems[0].active).toBe(true);
    expect(searchRun.status).toBe('SUCCESS');
    expect(searchRun.itemsFound).toBe(2);
    expect(searchRun.itemsAdded).toBe(2);
  });

  it('skips items that already exist (by url)', async () => {
    const existing: DiscoveredItemRow[] = [
      {
        id: 'x', title: 'Old', type: 'EVENT', provider: '', url: 'https://example.com/1', description: '',
        format: 'PHYSICAL', location: '', startDate: null, endDate: null, duration: null, priceStatus: 'UNKNOWN',
        tier: 'BASICS', tierRationale: '', relevanceScore: 0, speakersCompanies: '', active: true,
        discoveredAt: '', sourceQuery: '', topicIds: 't1',
      },
    ];
    const searchFn = async (): Promise<RawResult[]> => [
      { title: 'Gen AI Strategy fundamentals', url: 'https://example.com/1', snippet: '' },
    ];

    const { newItems, searchRun } = await runDiscoveryForTopic(topic, existing, searchFn, new Date('2026-08-01'));

    expect(newItems).toHaveLength(0);
    expect(searchRun.itemsFound).toBe(1);
    expect(searchRun.itemsAdded).toBe(0);
  });

  it('returns a FAILED run with an error note when the search function throws', async () => {
    const searchFn = async (): Promise<RawResult[]> => {
      throw new Error('API down');
    };

    const { newItems, searchRun } = await runDiscoveryForTopic(topic, [], searchFn, new Date('2026-08-01'));

    expect(newItems).toHaveLength(0);
    expect(searchRun.status).toBe('FAILED');
    expect(searchRun.errorNote).toContain('API down');
  });
});

describe('runDailyDiscovery', () => {
  it('runs every topic, adds new items to the workbook, and logs one SearchRun per topic', async () => {
    const wb = emptyWorkbook();
    wb.topics = [
      { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI' },
      { id: 't2', name: 'Smart Assets', category: 'Smart Assets', keywords: 'Digital Continuity' },
    ];
    const searchFn = async (t: TopicRow) => [
      { title: `${t.name} intro`, url: `https://example.com/${t.id}`, snippet: 'Free intro' },
    ];

    const { alerts } = await runDailyDiscovery(wb, searchFn, new Date('2026-08-01'));

    expect(alerts).toHaveLength(0);
    expect(wb.discoveredItems).toHaveLength(2);
    expect(wb.searchRuns).toHaveLength(2);
    expect(wb.searchRuns.every((r) => r.status === 'SUCCESS')).toBe(true);
  });

  it("continues with other topics and returns an alert when one topic's search fails", async () => {
    const wb = emptyWorkbook();
    wb.topics = [
      { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI' },
      { id: 't2', name: 'Smart Assets', category: 'Smart Assets', keywords: 'Digital Continuity' },
    ];
    const searchFn = async (t: TopicRow) => {
      if (t.id === 't1') throw new Error('API down');
      return [{ title: `${t.name} intro`, url: `https://example.com/${t.id}`, snippet: 'Free intro' }];
    };

    const { alerts } = await runDailyDiscovery(wb, searchFn, new Date('2026-08-01'));

    expect(alerts).toHaveLength(1);
    expect(alerts[0].topic.id).toBe('t1');
    expect(wb.discoveredItems).toHaveLength(1);
    expect(wb.searchRuns).toHaveLength(2);
    expect(wb.searchRuns.find((r) => r.topicId === 't1')?.status).toBe('FAILED');
  });
});
