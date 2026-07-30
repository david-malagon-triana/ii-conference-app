import { Workbook } from './workbook/types';

export interface ReportingStats {
  interestByTopic: Record<string, number>;
  priceSplit: Record<'FREE' | 'PAID' | 'UNKNOWN', number>;
  tierDistribution: Record<string, number>;
  pmNotifiedCount: number;
  catalogGrowthByDay: Record<string, number>;
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

  return { interestByTopic, priceSplit, tierDistribution, pmNotifiedCount, catalogGrowthByDay };
}
