import { describe, it, expect } from 'vitest';
import { applyCatalogUpdates, EDITABLE_CATALOG_FIELDS } from '../../lib/admin/catalogUpdates';
import { DiscoveredItemRow } from '../../lib/workbook/types';

function item(): DiscoveredItemRow {
  return {
    id: 'i1', title: 'Gen AI Strategy webinar', type: 'WEBINAR', provider: 'Example Org',
    url: 'https://example.com/1', description: 'A free introduction', format: 'ONLINE', location: '',
    startDate: '2026-09-12', endDate: null, duration: '2 hours', priceStatus: 'FREE',
    tier: 'FUNDAMENTALS', tierRationale: 'intro keyword', relevanceScore: 0.5, speakersCompanies: '',
    active: true, discoveredAt: '2026-08-01T00:00:00.000Z', sourceQuery: 'Gen AI', topicIds: 't1',
  };
}

describe('applyCatalogUpdates', () => {
  it('applies the whitelisted editable fields', () => {
    const target = item();
    const applied = applyCatalogUpdates(target, {
      title: 'Corrected title',
      description: 'Corrected description',
      tier: 'ADVANCED',
      priceStatus: 'PAID',
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      duration: '3 days',
      location: 'Oslo',
      active: false,
    });

    expect(applied.sort()).toEqual([...EDITABLE_CATALOG_FIELDS].sort());
    expect(target.title).toBe('Corrected title');
    expect(target.tier).toBe('ADVANCED');
    expect(target.priceStatus).toBe('PAID');
    expect(target.startDate).toBe('2026-10-05');
    expect(target.endDate).toBe('2026-10-07');
    expect(target.duration).toBe('3 days');
    expect(target.location).toBe('Oslo');
    expect(target.active).toBe(false);
  });

  it('ignores non-whitelisted fields instead of mass-assigning them', () => {
    const target = item();
    const applied = applyCatalogUpdates(target, {
      id: 'hijacked',
      topicIds: 't9',
      relevanceScore: 99,
      discoveredAt: '1999-01-01',
      sourceQuery: 'nope',
      url: 'https://evil.example.com',
      provider: 'nope',
      type: 'COURSE',
      format: 'PHYSICAL',
      tierRationale: 'nope',
      speakersCompanies: 'nope',
      tier: 'EXPERT',
    });

    expect(applied).toEqual(['tier']);
    expect(target.id).toBe('i1');
    expect(target.topicIds).toBe('t1');
    expect(target.relevanceScore).toBe(0.5);
    expect(target.discoveredAt).toBe('2026-08-01T00:00:00.000Z');
    expect(target.sourceQuery).toBe('Gen AI');
    expect(target.url).toBe('https://example.com/1');
    expect(target.provider).toBe('Example Org');
    expect(target.type).toBe('WEBINAR');
    expect(target.format).toBe('ONLINE');
    expect(target.tier).toBe('EXPERT');
  });

  it('rejects invalid enum values and wrongly typed values', () => {
    const target = item();
    applyCatalogUpdates(target, {
      tier: 'SUPER_EXPERT',
      priceStatus: 'CHEAP',
      active: 'false',
      title: 42,
    });

    expect(target.tier).toBe('FUNDAMENTALS');
    expect(target.priceStatus).toBe('FREE');
    expect(target.active).toBe(true);
    expect(target.title).toBe('Gen AI Strategy webinar');
  });

  it('normalizes blank nullable fields to null and keeps blank plain strings as ""', () => {
    const target = item();
    applyCatalogUpdates(target, { startDate: '', duration: '   ', endDate: null, location: '' });

    expect(target.startDate).toBeNull();
    expect(target.duration).toBeNull();
    expect(target.endDate).toBeNull();
    expect(target.location).toBe('');
  });

  it('is a no-op for a missing or non-object payload', () => {
    const target = item();
    expect(applyCatalogUpdates(target, undefined)).toEqual([]);
    expect(applyCatalogUpdates(target, null)).toEqual([]);
    expect(applyCatalogUpdates(target, 'nope')).toEqual([]);
    expect(target).toEqual(item());
  });
});
