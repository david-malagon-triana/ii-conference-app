import { TopicRow } from '../workbook/types';
import { RawResult } from './classifier';

export interface GoogleSearchConfig {
  apiKey: string;
  cseId: string;
}

/** How long to wait for the Custom Search API before giving up, in milliseconds. */
export const SEARCH_TIMEOUT_MS = 15_000;

export async function searchGoogle(
  topic: TopicRow,
  config: GoogleSearchConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<RawResult[]> {
  const query = encodeURIComponent(topic.keywords);
  const url = `https://www.googleapis.com/customsearch/v1?key=${config.apiKey}&cx=${config.cseId}&q=${query}`;

  // A hung request (routine behind a corporate proxy) must fail fast rather than block the
  // discovery run forever — the abort turns it into a normal FAILED SearchRun for this topic.
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Google Custom Search request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { items?: { title?: string; link?: string; snippet?: string }[] };
  // `title`/`link`/`snippet` are all optional in the API response. Defaulting them here keeps
  // `undefined` out of a RawResult (and therefore out of the workbook, where an undefined cell
  // becomes an array hole that corrupts the whole row on reload).
  return (data.items ?? []).map((item) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    snippet: item.snippet ?? '',
  }));
}
