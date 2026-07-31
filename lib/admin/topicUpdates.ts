import { TopicRow } from '../workbook/types';

/** Only these topic fields are editable; `id` is never reassignable. */
export const EDITABLE_TOPIC_FIELDS = ['name', 'category', 'keywords'] as const;

export type EditableTopicField = (typeof EDITABLE_TOPIC_FIELDS)[number];

/**
 * Validates every whitelisted field present in `updates`, then applies them to `topic` only if
 * ALL of them are valid strings — an all-or-nothing update, mirroring `applyCatalogUpdates`.
 */
export function applyTopicUpdates(
  topic: TopicRow,
  updates: unknown,
): { applied: EditableTopicField[]; rejected: string[] } {
  if (!updates || typeof updates !== 'object') return { applied: [], rejected: [] };
  const source = updates as Record<string, unknown>;
  const rejected: string[] = [];
  const normalized: Partial<Record<EditableTopicField, string>> = {};

  for (const field of EDITABLE_TOPIC_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source, field)) continue;
    const raw = source[field];
    if (typeof raw !== 'string') {
      rejected.push(field);
      continue;
    }
    normalized[field] = raw;
  }

  if (rejected.length > 0) {
    return { applied: [], rejected };
  }

  const applied: EditableTopicField[] = [];
  for (const field of Object.keys(normalized) as EditableTopicField[]) {
    topic[field] = normalized[field] as string;
    applied.push(field);
  }

  return { applied, rejected: [] };
}
