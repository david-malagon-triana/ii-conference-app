import { Workbook } from './workbook/types';

export interface ReportingStats {
  interestByTopic: Record<string, number>;
  priceSplit: Record<'FREE' | 'PAID' | 'UNKNOWN', number>;
  tierDistribution: Record<string, number>;
  pmNotifiedCount: number;
  catalogGrowthByDay: Record<string, number>;
  topItems: { itemId: string; title: string; count: number }[];
  uniqueEmployeeCount: number;
  interestTrendByWeek: Record<string, number>;
}

function weekStartKey(isoDateString: string): string {
  const d = new Date(isoDateString);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday));
  return monday.toISOString().slice(0, 10);
}

export function computeReportingStats(wb: Workbook): ReportingStats {
  const interestByTopic: Record<string, number> = {};
  for (const request of wb.interestRequests) {
    const item = wb.discoveredItems.find((i) => i.id === request.itemId);
    if (!item) continue;
    for (const topicId of item.topicIds.split(',').filter(Boolean)) {
      interestByTopic[topicId] = (interestByTopic[topicId] ?? 0) + 1;
    }
  }

  const priceSplit: Record<'FREE' | 'PAID' | 'UNKNOWN', number> = { FREE: 0, PAID: 0, UNKNOWN: 0 };
  const tierDistribution: Record<string, number> = { FUNDAMENTALS: 0, BASICS: 0, ADVANCED: 0, EXPERT: 0 };
  for (const item of wb.discoveredItems) {
    priceSplit[item.priceStatus] += 1;
    tierDistribution[item.tier] += 1;
  }

  const pmNotifiedCount = wb.interestRequests.filter((r) => r.pmNotified).length;

  const catalogGrowthByDay: Record<string, number> = {};
  for (const item of wb.discoveredItems) {
    const day = item.discoveredAt.slice(0, 10);
    catalogGrowthByDay[day] = (catalogGrowthByDay[day] ?? 0) + 1;
  }

  const interestCountByItem: Record<string, number> = {};
  for (const request of wb.interestRequests) {
    interestCountByItem[request.itemId] = (interestCountByItem[request.itemId] ?? 0) + 1;
  }
  const topItems = wb.discoveredItems
    .map((item) => ({
      itemId: item.id,
      title: item.title,
      count: interestCountByItem[item.id] ?? 0,
      discoveredAt: item.discoveredAt,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.discoveredAt !== b.discoveredAt) return a.discoveredAt < b.discoveredAt ? -1 : 1;
      return a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0;
    })
    .slice(0, 10)
    .map(({ itemId, title, count }) => ({ itemId, title, count }));

  const uniqueEmployeeCount = new Set(
    wb.interestRequests.map((r) => r.employeeEmail.trim().toLowerCase()),
  ).size;

  const interestTrendByWeek: Record<string, number> = {};
  for (const request of wb.interestRequests) {
    const week = weekStartKey(request.createdAt);
    if (!week) continue;
    interestTrendByWeek[week] = (interestTrendByWeek[week] ?? 0) + 1;
  }

  return {
    interestByTopic,
    priceSplit,
    tierDistribution,
    pmNotifiedCount,
    catalogGrowthByDay,
    topItems,
    uniqueEmployeeCount,
    interestTrendByWeek,
  };
}
