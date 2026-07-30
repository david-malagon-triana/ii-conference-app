import { TopicRow } from '../workbook/types';
import { RawResult } from './classifier';

export interface GoogleSearchConfig {
  apiKey: string;
  cseId: string;
}

export async function searchGoogle(
  topic: TopicRow,
  config: GoogleSearchConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<RawResult[]> {
  const query = encodeURIComponent(topic.keywords);
  const url = `https://www.googleapis.com/customsearch/v1?key=${config.apiKey}&cx=${config.cseId}&q=${query}`;

  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Google Custom Search request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { items?: { title: string; link: string; snippet: string }[] };
  return (data.items ?? []).map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
  }));
}
