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
  it('applies the whitelisted editable fields when all are valid', () => {
    const target = item();
    const { applied, rejected } = applyCatalogUpdates(target, {
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

    expect(rejected).toEqual([]);
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
    const { applied, rejected } = applyCatalogUpdates(target, {
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

    expect(rejected).toEqual([]);
    expect(applied).toEqual(['tier']);
    expect(target.id).toBe('i1');
    expect(target.topicIds).toBe('t1');
    expect(target.relevanceScore).toBe(0.5);
    expect(target.tier).toBe('EXPERT');
  });

  it('rejects the whole update and names every invalid field when any field is invalid', () => {
    const target = item();
    const { applied, rejected } = applyCatalogUpdates(target, {
      tier: 'SUPER_EXPERT',
      priceStatus: 'CHEAP',
      active: 'false',
      title: 42,
    });

    expect(applied).toEqual([]);
    expect(rejected.sort()).toEqual(['active', 'priceStatus', 'tier', 'title']);
    expect(target.tier).toBe('FUNDAMENTALS');
    expect(target.priceStatus).toBe('FREE');
    expect(target.active).toBe(true);
    expect(target.title).toBe('Gen AI Strategy webinar');
  });

  it('rejects the whole update even when only one field out of several is invalid — no partial save', () => {
    const target = item();
    const { applied, rejected } = applyCatalogUpdates(target, {
      title: 'This should NOT be saved',
      description: 'Neither should this',
      tier: 'NOT_A_REAL_TIER',
    });

    expect(applied).toEqual([]);
    expect(rejected).toEqual(['tier']);
    expect(target.title).toBe('Gen AI Strategy webinar');
    expect(target.description).toBe('A free introduction');
    expect(target.tier).toBe('FUNDAMENTALS');
  });

  it('normalizes blank nullable fields to null and keeps blank plain strings as ""', () => {
    const target = item();
    const { rejected } = applyCatalogUpdates(target, { startDate: '', duration: '   ', endDate: null, location: '' });

    expect(rejected).toEqual([]);
    expect(target.startDate).toBeNull();
    expect(target.duration).toBeNull();
    expect(target.endDate).toBeNull();
    expect(target.location).toBe('');
  });

  it('rejects a malformed (non-ISO) startDate like "01/09/2026"', () => {
    const target = item();
    const { applied, rejected } = applyCatalogUpdates(target, { startDate: '01/09/2026' });

    expect(applied).toEqual([]);
    expect(rejected).toEqual(['startDate']);
    expect(target.startDate).toBe('2026-09-12');
  });

  it('rejects a syntactically-ISO-shaped but invalid calendar date like "2026-13-45"', () => {
    const target = item();
    const { applied, rejected } = applyCatalogUpdates(target, { endDate: '2026-13-45' });

    expect(applied).toEqual([]);
    expect(rejected).toEqual(['endDate']);
    expect(target.endDate).toBeNull();
  });

  it('accepts a valid ISO date for both startDate and endDate', () => {
    const target = item();
    const { applied, rejected } = applyCatalogUpdates(target, {
      startDate: '2026-09-12',
      endDate: '2026-09-12',
    });

    expect(rejected).toEqual([]);
    expect(applied.sort()).toEqual(['endDate', 'startDate']);
    expect(target.startDate).toBe('2026-09-12');
    expect(target.endDate).toBe('2026-09-12');
  });

  it('is a no-op for a missing or non-object payload', () => {
    const target = item();
    expect(applyCatalogUpdates(target, undefined)).toEqual({ applied: [], rejected: [] });
    expect(applyCatalogUpdates(target, null)).toEqual({ applied: [], rejected: [] });
    expect(applyCatalogUpdates(target, 'nope')).toEqual({ applied: [], rejected: [] });
    expect(target).toEqual(item());
  });
});
