import { describe, it, expect } from 'vitest';
import { applyTopicUpdates, EDITABLE_TOPIC_FIELDS } from '../../lib/admin/topicUpdates';
import { TopicRow } from '../../lib/workbook/types';

function topic(): TopicRow {
  return { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI' };
}

describe('applyTopicUpdates', () => {
  it('applies the whitelisted editable fields when all are valid', () => {
    const target = topic();
    const { applied, rejected } = applyTopicUpdates(target, {
      name: 'Data Strategy & Governance',
      category: 'Data',
      keywords: 'Gen AI, governance',
    });

    expect(rejected).toEqual([]);
    expect(applied.sort()).toEqual([...EDITABLE_TOPIC_FIELDS].sort());
    expect(target.name).toBe('Data Strategy & Governance');
    expect(target.category).toBe('Data');
    expect(target.keywords).toBe('Gen AI, governance');
  });

  it('ignores non-whitelisted fields instead of mass-assigning them', () => {
    const target = topic();
    const { applied, rejected } = applyTopicUpdates(target, { id: 'hijacked', name: 'New name' });

    expect(rejected).toEqual([]);
    expect(applied).toEqual(['name']);
    expect(target.id).toBe('t1');
    expect(target.name).toBe('New name');
  });

  it('rejects the whole update and names every non-string field', () => {
    const target = topic();
    const { applied, rejected } = applyTopicUpdates(target, { name: 42, category: null });

    expect(applied).toEqual([]);
    expect(rejected.sort()).toEqual(['category', 'name']);
    expect(target.name).toBe('Data Strategy');
    expect(target.category).toBe('Data Strategy');
  });

  it('rejects the whole update even when only one field out of several is invalid', () => {
    const target = topic();
    const { applied, rejected } = applyTopicUpdates(target, { name: 'Valid name', keywords: 123 });

    expect(applied).toEqual([]);
    expect(rejected).toEqual(['keywords']);
    expect(target.name).toBe('Data Strategy');
  });

  it('is a no-op for a missing or non-object payload', () => {
    const target = topic();
    expect(applyTopicUpdates(target, undefined)).toEqual({ applied: [], rejected: [] });
    expect(applyTopicUpdates(target, null)).toEqual({ applied: [], rejected: [] });
    expect(target).toEqual(topic());
  });
});
