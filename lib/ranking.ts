import { DiscoveredItemRow, TopicRow } from './workbook/types';

export function topPicksByTopic(
  items: DiscoveredItemRow[],
  topics: TopicRow[],
  n: number = 3,
): { topic: TopicRow; items: DiscoveredItemRow[] }[] {
  const result: { topic: TopicRow; items: DiscoveredItemRow[] }[] = [];

  for (const topic of topics) {
    const topicItems = items
      .filter((i) => i.active && i.topicIds.split(',').includes(topic.id))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, n);

    if (topicItems.length > 0) {
      result.push({ topic, items: topicItems });
    }
  }

  return result;
}
