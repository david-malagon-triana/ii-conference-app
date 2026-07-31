import { DiscoveredItemRow, ItemFormat, ItemType, PriceStatus, Tier } from '../workbook/types';

/**
 * The only DiscoveredItem fields an admin may change through the moderation API.
 *
 * Deliberately explicit: an `Object.assign(item, body.updates)` would let a caller overwrite
 * `id`, `topicIds`, `relevanceScore`, `discoveredAt` and friends — classic mass assignment.
 */
export const EDITABLE_CATALOG_FIELDS = [
  'title',
  'description',
  'tier',
  'priceStatus',
  'startDate',
  'endDate',
  'duration',
  'location',
  'active',
] as const;

export type EditableCatalogField = (typeof EDITABLE_CATALOG_FIELDS)[number];

const NULLABLE_FIELDS = new Set<EditableCatalogField>(['startDate', 'endDate', 'duration']);

const TIERS: Tier[] = ['FUNDAMENTALS', 'BASICS', 'ADVANCED', 'EXPERT'];
const PRICE_STATUSES: PriceStatus[] = ['FREE', 'PAID', 'UNKNOWN'];
const TYPES: ItemType[] = ['COURSE', 'WEBINAR', 'SEMINAR', 'EVENT'];
const FORMATS: ItemFormat[] = ['ONLINE', 'PHYSICAL'];

export { TIERS, PRICE_STATUSES, TYPES, FORMATS };

/**
 * Validates every whitelisted field present in `updates`, then applies them to `item` only if
 * ALL of them are valid — an all-or-nothing update. If any field fails validation, `item` is left
 * completely untouched and `rejected` names every field that failed, so the caller can reject the
 * whole request (400) instead of silently saving a partial edit.
 */
export function applyCatalogUpdates(
  item: DiscoveredItemRow,
  updates: unknown,
): { applied: EditableCatalogField[]; rejected: string[] } {
  if (!updates || typeof updates !== 'object') return { applied: [], rejected: [] };
  const source = updates as Record<string, unknown>;
  const rejected: string[] = [];
  const normalized: Partial<Record<EditableCatalogField, string | boolean | null>> = {};

  for (const field of EDITABLE_CATALOG_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source, field)) continue;
    const raw = source[field];

    if (field === 'active') {
      if (typeof raw !== 'boolean') {
        rejected.push(field);
        continue;
      }
      normalized.active = raw;
      continue;
    }

    if (field === 'tier') {
      if (!TIERS.includes(raw as Tier)) {
        rejected.push(field);
        continue;
      }
      normalized.tier = raw as Tier;
      continue;
    }

    if (field === 'priceStatus') {
      if (!PRICE_STATUSES.includes(raw as PriceStatus)) {
        rejected.push(field);
        continue;
      }
      normalized.priceStatus = raw as PriceStatus;
      continue;
    }

    if (raw !== null && typeof raw !== 'string') {
      rejected.push(field);
      continue;
    }
    const value = raw === null ? '' : raw;
    normalized[field] = NULLABLE_FIELDS.has(field) && value.trim() === '' ? null : value;
  }

  if (rejected.length > 0) {
    return { applied: [], rejected };
  }

  const applied: EditableCatalogField[] = [];
  for (const field of Object.keys(normalized) as EditableCatalogField[]) {
    const value = normalized[field];
    switch (field) {
      case 'active':
        item.active = value as boolean;
        break;
      case 'tier':
        item.tier = value as Tier;
        break;
      case 'priceStatus':
        item.priceStatus = value as PriceStatus;
        break;
      case 'title':
        item.title = value as string;
        break;
      case 'description':
        item.description = value as string;
        break;
      case 'location':
        item.location = value as string;
        break;
      case 'startDate':
        item.startDate = value as string | null;
        break;
      case 'endDate':
        item.endDate = value as string | null;
        break;
      case 'duration':
        item.duration = value as string | null;
        break;
    }
    applied.push(field);
  }

  return { applied, rejected: [] };
}
