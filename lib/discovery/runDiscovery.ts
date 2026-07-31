import { randomUUID } from 'crypto';
import { DiscoveredItemRow, SearchRunRow, TopicRow, Workbook } from '../workbook/types';
import { classify, RawResult } from './classifier';
import { isDuplicate } from './dedupe';
import { SearchProvider } from './searchProvider';

/**
 * One topic's search outcome, captured *before* the workbook write lock is taken.
 * `results` is null exactly when the search failed, in which case `error` explains why.
 */
export interface TopicSearchOutcome {
  topic: TopicRow;
  results: RawResult[] | null;
  error: string | null;
}

/**
 * Step 1 of a discovery run: all network I/O, and nothing else.
 *
 * This must stay outside `withWorkbook` — the write lock is a single process-wide promise chain,
 * so holding it across a sequence of HTTP requests means one slow or hung request blocks every
 * other write in the app (mark interest, settings, moderation, reminders) until a restart.
 */
export async function fetchDiscoveryCandidates(
  topics: TopicRow[],
  searchFn: SearchProvider,
): Promise<TopicSearchOutcome[]> {
  const outcomes: TopicSearchOutcome[] = [];

  for (const topic of topics) {
    try {
      outcomes.push({ topic, results: await searchFn(topic), error: null });
    } catch (err) {
      outcomes.push({ topic, results: null, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return outcomes;
}

/** Turn already-fetched raw results into new catalog rows, deduped against what's already there. */
export function classifyTopicResults(
  topic: TopicRow,
  existingItems: DiscoveredItemRow[],
  rawResults: RawResult[],
  now: Date,
): { newItems: DiscoveredItemRow[]; searchRun: SearchRunRow } {
  const ranAt = now.toISOString();
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

export function failedSearchRun(topic: TopicRow, error: string, now: Date): SearchRunRow {
  return {
    id: randomUUID(),
    topicId: topic.id,
    ranAt: now.toISOString(),
    status: 'FAILED',
    itemsFound: 0,
    itemsAdded: 0,
    errorNote: error,
  };
}

/**
 * Step 2 of a discovery run: pure in-memory workbook mutation over already-fetched results.
 * No network I/O here, so this is safe (and short) to run inside `withWorkbook`.
 */
export function applyDiscoveryResults(
  wb: Workbook,
  outcomes: TopicSearchOutcome[],
  now: Date,
): { alerts: { topic: TopicRow; error: string }[] } {
  const alerts: { topic: TopicRow; error: string }[] = [];

  for (const outcome of outcomes) {
    if (outcome.results === null) {
      const error = outcome.error ?? 'Unknown search error';
      wb.searchRuns.push(failedSearchRun(outcome.topic, error, now));
      alerts.push({ topic: outcome.topic, error });
      continue;
    }

    const { newItems, searchRun } = classifyTopicResults(
      outcome.topic,
      wb.discoveredItems,
      outcome.results,
      now,
    );
    wb.discoveredItems.push(...newItems);
    wb.searchRuns.push(searchRun);
  }

  return { alerts };
}

/** Fetch + classify a single topic. Convenience wrapper over the two steps above. */
export async function runDiscoveryForTopic(
  topic: TopicRow,
  existingItems: DiscoveredItemRow[],
  searchFn: SearchProvider,
  now: Date,
): Promise<{ newItems: DiscoveredItemRow[]; searchRun: SearchRunRow }> {
  const [outcome] = await fetchDiscoveryCandidates([topic], searchFn);

  if (outcome.results === null) {
    return { newItems: [], searchRun: failedSearchRun(topic, outcome.error ?? 'Unknown search error', now) };
  }

  return classifyTopicResults(topic, existingItems, outcome.results, now);
}

/**
 * Fetch + apply every topic against an in-memory workbook.
 *
 * NOTE: this performs network I/O, so it must not be called from inside `withWorkbook`.
 * Production callers should use `runDiscoveryAndAlert` in `discoveryJob.ts`, which splits the
 * two phases around the write lock; this function remains for tests and direct in-memory use.
 */
export async function runDailyDiscovery(
  wb: Workbook,
  searchFn: SearchProvider,
  now: Date,
): Promise<{ alerts: { topic: TopicRow; error: string }[] }> {
  const outcomes = await fetchDiscoveryCandidates(wb.topics, searchFn);
  return applyDiscoveryResults(wb, outcomes, now);
}
