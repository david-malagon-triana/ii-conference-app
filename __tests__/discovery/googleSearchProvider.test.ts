import { describe, it, expect, vi } from 'vitest';
import { searchGoogle } from '../../lib/discovery/googleSearchProvider';
import { TopicRow } from '../../lib/workbook/types';

const topic: TopicRow = { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI Strategy' };

describe('searchGoogle', () => {
  it('calls the Custom Search endpoint with the topic keywords and maps results', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { title: 'Gen AI Strategy course', link: 'https://example.com/1', snippet: 'Learn Gen AI strategy' },
          { title: 'Gen AI Strategy webinar', link: 'https://example.com/2', snippet: 'Free webinar' },
        ],
      }),
    });

    const results = await searchGoogle(topic, { apiKey: 'key', cseId: 'cse' }, fakeFetch as any);

    expect(fakeFetch).toHaveBeenCalledWith(
      expect.stringContaining('customsearch/v1'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fakeFetch.mock.calls[0][0]).toContain('key=key');
    expect(fakeFetch.mock.calls[0][0]).toContain('cx=cse');
    expect(results).toEqual([
      { title: 'Gen AI Strategy course', url: 'https://example.com/1', snippet: 'Learn Gen AI strategy' },
      { title: 'Gen AI Strategy webinar', url: 'https://example.com/2', snippet: 'Free webinar' },
    ]);
  });

  it('returns an empty array when the API responds with no items', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const results = await searchGoogle(topic, { apiKey: 'key', cseId: 'cse' }, fakeFetch as any);
    expect(results).toEqual([]);
  });

  it('throws when the API responds with a non-ok status', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' });
    await expect(searchGoogle(topic, { apiKey: 'key', cseId: 'cse' }, fakeFetch as any)).rejects.toThrow(/429/);
  });

  it('passes an abort signal so a hung request cannot block the run forever', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await searchGoogle(topic, { apiKey: 'key', cseId: 'cse' }, fakeFetch as any);
    const init = fakeFetch.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal.aborted).toBe(false);
  });

  it('defaults missing title/link/snippet to empty strings rather than undefined', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      // A real Custom Search result can omit `snippet` entirely; an undefined value here would
      // reach the workbook as an undefined cell and corrupt the row on reload.
      json: async () => ({ items: [{ title: 'No snippet here', link: 'https://example.com/1' }] }),
    });

    const results = await searchGoogle(topic, { apiKey: 'key', cseId: 'cse' }, fakeFetch as any);

    expect(results).toEqual([{ title: 'No snippet here', url: 'https://example.com/1', snippet: '' }]);
    expect(results[0].snippet).not.toBeUndefined();
  });
});
