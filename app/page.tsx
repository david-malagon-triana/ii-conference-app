async function getTopPicks() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/catalog`, {
    cache: 'no-store',
  });
  const { items, topics } = await res.json();
  const { topPicksByTopic } = await import('@/lib/ranking');
  return topPicksByTopic(items, topics, 3);
}

import { ItemCard } from '@/components/ItemCard';

export default async function HomePage() {
  const rows = await getTopPicks();

  return (
    <div>
      <p className="text-base font-normal mb-4">This week's picks</p>
      {rows.map(({ topic, items }) => (
        <div key={topic.id} className="mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-invent-grey4">{topic.name}</span>
            <a href={`/catalog?topicId=${topic.id}`} className="text-xs text-invent-blue">
              See all &rarr;
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-invent-grey4 text-sm">
          No picks yet — the daily discovery run hasn't found anything, or hasn't run yet.
        </p>
      )}
    </div>
  );
}
