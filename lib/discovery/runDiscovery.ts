import { randomUUID } from 'crypto';
import { DiscoveredItemRow, SearchRunRow, TopicRow, Workbook } from '../workbook/types';
import { classify, RawResult } from './classifier';
import { isDuplicate } from './dedupe';

export async function runDiscoveryForTopic(
  topic: TopicRow,
  existingItems: DiscoveredItemRow[],
  searchFn: (t: TopicRow) => Promise<RawResult[]>,
  now: Date,
): Promise<{ newItems: DiscoveredItemRow[]; searchRun: SearchRunRow }> {
  const ranAt = now.toISOString();

  let rawResults: RawResult[];
  try {
    rawResults = await searchFn(topic);
  } catch (err) {
    return {
      newItems: [],
      searchRun: {
        id: randomUUID(),
        topicId: topic.id,
        ranAt,
        status: 'FAILED',
        itemsFound: 0,
        itemsAdded: 0,
        errorNote: err instanceof Error ? err.message : String(err),
      },
    };
  }

  const newItems: DiscoveredItemRow[] = [];
  for (const raw of rawResults) {
    if (isDuplicate(raw, [...existingItems, ...newItems])) continue;
    const draft = classify(raw, topic);
    newItems.push({
      id: randomUUID(),
      title: raw.title,
      type: draft.type,
      provider: '',
      url: raw.url,
      description: raw.snippet,
      format: draft.format,
      location: '',
      startDate: draft.startDate,
      endDate: null,
      duration: draft.duration,
      priceStatus: draft.priceStatus,
      tier: draft.tier,
      tierRationale: draft.tierRationale,
      relevanceScore: draft.relevanceScore,
      speakersCompanies: '',
      active: true,
      discoveredAt: ranAt,
      sourceQuery: topic.keywords,
      topicIds: topic.id,
    });
  }

  return {
    newItems,
    searchRun: {
      id: randomUUID(),
      topicId: topic.id,
      ranAt,
      status: 'SUCCESS',
      itemsFound: rawResults.length,
      itemsAdded: newItems.length,
      errorNote: '',
    },
  };
}

export async function runDailyDiscovery(
  wb: Workbook,
  searchFn: (t: TopicRow) => Promise<RawResult[]>,
  now: Date,
): Promise<{ alerts: { topic: TopicRow; error: string }[] }> {
  const alerts: { topic: TopicRow; error: string }[] = [];

  for (const topic of wb.topics) {
    const { newItems, searchRun } = await runDiscoveryForTopic(topic, wb.discoveredItems, searchFn, now);
    wb.discoveredItems.push(...newItems);
    wb.searchRuns.push(searchRun);
    if (searchRun.status === 'FAILED') {
      alerts.push({ topic, error: searchRun.errorNote });
    }
  }

  return { alerts };
}
