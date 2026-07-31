import { describe, it, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { loadWorkbook, saveWorkbook, withWorkbook } from '../../lib/workbook/store';
import { DiscoveredItemRow, InterestRequestRow, emptyWorkbook } from '../../lib/workbook/types';
import { queryCatalog } from '../../lib/catalogQuery';

function item(overrides: Partial<DiscoveredItemRow> = {}): DiscoveredItemRow {
  return {
    id: 'i1', title: 'Gen AI Strategy webinar', type: 'WEBINAR', provider: '', url: 'https://example.com/1',
    description: 'A free introduction', format: 'ONLINE', location: '', startDate: '2026-09-12',
    endDate: null, duration: '2 hours', priceStatus: 'FREE', tier: 'FUNDAMENTALS',
    tierRationale: 'intro keyword', relevanceScore: 0.5, speakersCompanies: '', active: true,
    discoveredAt: '2026-08-01T00:00:00.000Z', sourceQuery: 'Gen AI', topicIds: 't1',
    ...overrides,
  };
}

function tmpFile(): string {
  return path.join(os.tmpdir(), `wb-test-${Date.now()}-${Math.random()}.xlsx`);
}

let filesToClean: string[] = [];
afterEach(async () => {
  await Promise.all(filesToClean.map((f) => fs.rm(f, { force: true })));
  filesToClean = [];
});

describe('loadWorkbook', () => {
  it('returns an empty workbook when the file does not exist', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = await loadWorkbook(file);
    expect(wb).toEqual(emptyWorkbook());
  });

  it('round-trips a workbook through save then load', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = emptyWorkbook();
    wb.topics.push({ id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'AI, governance' });
    wb.settings.push({ key: 'reminderLeadDays', value: '3' });
    await saveWorkbook(file, wb);
    const loaded = await loadWorkbook(file);
    expect(loaded.topics).toEqual(wb.topics);
    expect(loaded.settings).toEqual(wb.settings);
  });

  it('round-trips discoveredItems and interestRequests without losing fields', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = emptyWorkbook();
    wb.discoveredItems.push(item());
    const request: InterestRequestRow = {
      id: 'r1', itemId: 'i1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com',
      pmName: null, pmEmail: null, pmNotified: false, pmNotifiedAt: null,
      createdAt: '2026-08-01T00:00:00.000Z', reminderSent: false,
    };
    wb.interestRequests.push(request);

    await saveWorkbook(file, wb);
    const loaded = await loadWorkbook(file);

    expect(loaded.discoveredItems).toEqual(wb.discoveredItems);
    expect(loaded.interestRequests).toEqual(wb.interestRequests);
  });

  it('normalizes an empty description to "" rather than undefined on reload', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = emptyWorkbook();
    wb.discoveredItems.push(item({ id: 'i1', description: '' }));

    await saveWorkbook(file, wb);
    const loaded = await loadWorkbook(file);

    expect(loaded.discoveredItems[0].description).toBe('');
  });

  it('normalizes an undefined string field to "" on reload instead of corrupting the row', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = emptyWorkbook();
    // exceljs writes an *array hole* (not an undefined value) for a cell written as undefined,
    // which `Array.prototype.map` silently skips — the regression this guards against.
    wb.discoveredItems.push(item({ id: 'i1', description: undefined as unknown as string }));
    wb.discoveredItems.push(item({ id: 'i2', url: 'https://example.com/2', location: undefined as unknown as string }));

    await saveWorkbook(file, wb);
    const loaded = await loadWorkbook(file);

    expect(loaded.discoveredItems[0].description).toBe('');
    expect(loaded.discoveredItems[0].title).toBe('Gen AI Strategy webinar');
    // Fields *after* the hole must not be shifted along by one column.
    expect(loaded.discoveredItems[0].format).toBe('ONLINE');
    expect(loaded.discoveredItems[0].priceStatus).toBe('FREE');
    expect(loaded.discoveredItems[0].tier).toBe('FUNDAMENTALS');
    expect(loaded.discoveredItems[0].topicIds).toBe('t1');
    expect(loaded.discoveredItems[1].location).toBe('');
    expect(loaded.discoveredItems[1].active).toBe(true);

    // The original 500: a search filter calling `.toLowerCase()` on an undefined description.
    expect(() => queryCatalog(loaded.discoveredItems, { search: 'webinar' })).not.toThrow();
    expect(queryCatalog(loaded.discoveredItems, { search: 'webinar' })).toHaveLength(2);
    // i1 lost its description, so it can only match on title; i2 kept its description and
    // still matches on it. Neither case throws.
    expect(queryCatalog(loaded.discoveredItems, { search: 'introduction' }).map((i) => i.id)).toEqual(['i2']);
  });
});

describe('withWorkbook', () => {
  it('serializes concurrent mutations so no update is lost', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    await saveWorkbook(file, emptyWorkbook());

    const bump = () =>
      withWorkbook(file, (wb) => {
        const existing = wb.settings.find((s) => s.key === 'counter');
        const next = existing ? String(Number(existing.value) + 1) : '1';
        if (existing) existing.value = next;
        else wb.settings.push({ key: 'counter', value: next });
      });

    await Promise.all([bump(), bump(), bump(), bump(), bump()]);

    const final = await loadWorkbook(file);
    expect(final.settings.find((s) => s.key === 'counter')?.value).toBe('5');
  });
});
