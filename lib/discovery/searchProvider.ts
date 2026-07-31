import { TopicRow } from '../workbook/types';
import { RawResult } from './classifier';
import { searchGoogle } from './googleSearchProvider';
import { mockSearch } from './mockSearchProvider';

/**
 * The pluggable search interface from design spec §3: given a topic, return raw candidates.
 * This is exactly the shape `runDiscoveryForTopic`/`fetchDiscoveryCandidates` already accept
 * as their `searchFn` argument.
 */
export type SearchProvider = (topic: TopicRow) => Promise<RawResult[]>;

export type SearchProviderName = 'mock' | 'google';

/**
 * Environment shape provider selection reads. Structurally compatible with `process.env`
 * while still accepting a plain object literal in tests.
 * Keys used: `SEARCH_PROVIDER`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`.
 */
export type SearchProviderEnv = Record<string, string | undefined>;

/**
 * Selection rule (documented here rather than spread across callers):
 *
 *  - `SEARCH_PROVIDER=mock`   → always the offline mock, even if Google credentials exist
 *  - `SEARCH_PROVIDER=google` → always Google Custom Search (it will fail loudly per topic if
 *                               the credentials are missing, which is the honest outcome)
 *  - unset → Google when *both* `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` are set, otherwise mock
 *
 * Net effect: a fresh checkout with no environment configuration is fully demoable on the mock,
 * and dropping in the two Google variables is all it takes to go live.
 */
export function resolveSearchProviderName(env: SearchProviderEnv = process.env): SearchProviderName {
  const explicit = env.SEARCH_PROVIDER?.trim().toLowerCase();
  if (explicit === 'mock') return 'mock';
  if (explicit === 'google') return 'google';
  return env.GOOGLE_CSE_API_KEY && env.GOOGLE_CSE_ID ? 'google' : 'mock';
}

export function getSearchProvider(env: SearchProviderEnv = process.env): SearchProvider {
  if (resolveSearchProviderName(env) === 'mock') return mockSearch;

  const apiKey = env.GOOGLE_CSE_API_KEY ?? '';
  const cseId = env.GOOGLE_CSE_ID ?? '';
  return (topic: TopicRow) => searchGoogle(topic, { apiKey, cseId });
}
