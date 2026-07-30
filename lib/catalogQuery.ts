import { DiscoveredItemRow, ItemFormat, ItemType, Tier } from './workbook/types';
import { filterByDateRange } from './dateFilter';

export interface CatalogFilters {
  search?: string;
  topicId?: string;
  tier?: Tier;
  format?: ItemFormat;
  type?: ItemType;
  dateFrom?: Date;
  dateTo?: Date;
}

export function queryCatalog(items: DiscoveredItemRow[], filters: CatalogFilters): DiscoveredItemRow[] {
  let result = items.filter((i) => i.active);

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    result = result.filter(
      (i) => i.title.toLowerCase().includes(needle) || i.description.toLowerCase().includes(needle),
    );
  }
  if (filters.topicId) {
    result = result.filter((i) => i.topicIds.split(',').includes(filters.topicId!));
  }
  if (filters.tier) {
    result = result.filter((i) => i.tier === filters.tier);
  }
  if (filters.format) {
    result = result.filter((i) => i.format === filters.format);
  }
  if (filters.type) {
    result = result.filter((i) => i.type === filters.type);
  }
  if (filters.dateFrom || filters.dateTo) {
    result = filterByDateRange(result, filters.dateFrom ?? null, filters.dateTo ?? null);
  }

  return result;
}
