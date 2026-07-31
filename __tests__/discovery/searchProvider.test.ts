import { describe, it, expect } from 'vitest';
import { getSearchProvider, resolveSearchProviderName } from '../../lib/discovery/searchProvider';
import { mockSearch } from '../../lib/discovery/mockSearchProvider';
import { classify } from '../../lib/discovery/classifier';
import { TopicRow } from '../../lib/workbook/types';

const topic: TopicRow = {
  id: 't1',
  name: 'Data Strategy',
  category: 'Data Strategy',
  keywords: 'Gen AI Strategy, Data Governance',
};

describe('resolveSearchProviderName', () => {
  it('defaults to mock when no Google credentials are configured', () => {
    expect(resolveSearchProviderName({})).toBe('mock');
  });

  it('picks google when both credentials are present', () => {
    expect(
      resolveSearchProviderName({ GOOGLE_CSE_API_KEY: 'k', GOOGLE_CSE_ID: 'c' }),
    ).toBe('google');
  });

  it('stays on mock when only one credential is present', () => {
    expect(resolveSearchProviderName({ GOOGLE_CSE_API_KEY: 'k' })).toBe('mock');
    expect(resolveSearchProviderName({ GOOGLE_CSE_ID: 'c' })).toBe('mock');
  });

  it('lets SEARCH_PROVIDER override credential-based detection in both directions', () => {
    expect(
      resolveSearchProviderName({
        SEARCH_PROVIDER: 'mock',
        GOOGLE_CSE_API_KEY: 'k',
        GOOGLE_CSE_ID: 'c',
      }),
    ).toBe('mock');
    expect(resolveSearchProviderName({ SEARCH_PROVIDER: 'GOOGLE' })).toBe('google');
  });
});

describe('getSearchProvider', () => {
  it('returns the mock provider with no configuration at all', async () => {
    const provider = getSearchProvider({});
    expect(provider).toBe(mockSearch);
    await expect(provider(topic)).resolves.toHaveLength(3);
  });

  it('returns a callable google-backed provider when credentials exist', () => {
    const provider = getSearchProvider({ GOOGLE_CSE_API_KEY: 'k', GOOGLE_CSE_ID: 'c' });
    expect(provider).not.toBe(mockSearch);
    expect(typeof provider).toBe('function');
  });
});

describe('mockSearch', () => {
  it('returns three well-formed results per topic with no undefined fields', async () => {
    const results = await mockSearch(topic);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.url).toMatch(/^https:\/\//);
      expect(typeof r.snippet).toBe('string');
      expect(r.snippet.length).toBeGreaterThan(0);
    }
    expect(new Set(results.map((r) => r.url)).size).toBe(3);
  });

  it('produces varied classifier output so a demo catalog is not uniform', async () => {
    const drafts = (await mockSearch(topic)).map((r) => classify(r, topic));

    expect(drafts.map((d) => d.priceStatus)).toEqual(['FREE', 'PAID', 'UNKNOWN']);
    expect(new Set(drafts.map((d) => d.tier)).size).toBeGreaterThan(1);
    expect(new Set(drafts.map((d) => d.format))).toEqual(new Set(['ONLINE', 'PHYSICAL']));
    expect(drafts.every((d) => d.startDate !== null)).toBe(true);
  });

  it('varies results per topic', async () => {
    const other: TopicRow = { id: 't2', name: 'Smart Assets', category: 'Smart Assets', keywords: 'Digital Continuity' };
    const a = await mockSearch(topic);
    const b = await mockSearch(other);
    expect(a[0].url).not.toBe(b[0].url);
    expect(a[0].title).not.toBe(b[0].title);
  });
});
