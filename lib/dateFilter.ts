import { DiscoveredItemRow } from './workbook/types';

export function filterByDateRange(
  items: DiscoveredItemRow[],
  from: Date | null,
  to: Date | null,
): DiscoveredItemRow[] {
  if (!from && !to) return items;

  return items.filter((item) => {
    if (!item.startDate) return false;
    const date = new Date(item.startDate);
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
}
