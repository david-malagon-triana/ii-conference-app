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
 * Applies only whitelisted, well-typed fields from `updates` onto `item`, in place.
 * Returns the names of the fields that were actually applied.
 */
export function applyCatalogUpdates(item: DiscoveredItemRow, updates: unknown): EditableCatalogField[] {
  if (!updates || typeof updates !== 'object') return [];
  const source = updates as Record<string, unknown>;
  const applied: EditableCatalogField[] = [];

  for (const field of EDITABLE_CATALOG_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source, field)) continue;
    const raw = source[field];

    if (field === 'active') {
      if (typeof raw !== 'boolean') continue;
      item.active = raw;
      applied.push(field);
      continue;
    }

    if (field === 'tier') {
      if (!TIERS.includes(raw as Tier)) continue;
      item.tier = raw as Tier;
      applied.push(field);
      continue;
    }

    if (field === 'priceStatus') {
      if (!PRICE_STATUSES.includes(raw as PriceStatus)) continue;
      item.priceStatus = raw as PriceStatus;
      applied.push(field);
      continue;
    }

    if (raw !== null && typeof raw !== 'string') continue;
    const value = raw === null ? '' : raw;
    // Empty means "not specified" for the nullable fields, which the app represents as null.
    const nullable = NULLABLE_FIELDS.has(field) && value.trim() === '' ? null : value;

    switch (field) {
      case 'title':
        item.title = value;
        break;
      case 'description':
        item.description = value;
        break;
      case 'location':
        item.location = value;
        break;
      case 'startDate':
        item.startDate = nullable;
        break;
      case 'endDate':
        item.endDate = nullable;
        break;
      case 'duration':
        item.duration = nullable;
        break;
      default:
        continue;
    }
    applied.push(field);
  }

  return applied;
}
