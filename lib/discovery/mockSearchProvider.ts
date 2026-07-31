import { TopicRow } from '../workbook/types';
import { RawResult } from './classifier';

/**
 * Offline stand-in for the real `SearchProvider`, so the app can be demoed end to end with
 * zero external accounts (design spec §2/§3). Returns three templated candidates per topic,
 * deliberately worded so the rule-based classifier produces varied output:
 *
 *  1. a free online webinar at the Fundamentals tier, with an extractable date
 *  2. a paid advanced/certification course (PAID, ADVANCED)
 *  3. a physical summit with no price signal at all (UNKNOWN, EXPERT)
 */
export async function mockSearch(topic: TopicRow): Promise<RawResult[]> {
  const firstKeyword = topic.keywords.split(',')[0]?.trim() || topic.name;
  const slug = encodeURIComponent(topic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  return [
    {
      title: `Introduction to ${firstKeyword} — free webinar`,
      url: `https://mock.example.com/${slug}/intro-webinar`,
      snippet:
        `Free online webinar: an introduction to ${firstKeyword} for beginners. ` +
        `2 hours, 12 September 2026. No cost to attend.`,
    },
    {
      title: `${firstKeyword} advanced practitioner certification course`,
      url: `https://mock.example.com/${slug}/advanced-course`,
      snippet:
        `Advanced ${topic.name} training and certification for practitioners. ` +
        `Fee: 1200 EUR. 3 days, starting 5 October 2026.`,
    },
    {
      title: `${topic.name} Summit 2026`,
      url: `https://mock.example.com/${slug}/summit-2026`,
      snippet:
        `Annual ${topic.name} conference bringing together expert speakers on ${firstKeyword}. ` +
        `Oslo, 18 November 2026.`,
    },
  ];
}
