import { loadWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { topPicksByTopic } from '@/lib/ranking';
import { ItemCard } from '@/components/ItemCard';

// The workbook is read at request time, so this page must never be statically prerendered
// at build time (when the workbook may not exist yet).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Read the workbook directly rather than self-fetching our own /api/catalog over HTTP:
  // a server component calling back into its own origin needs a hardcoded base URL, breaks
  // when the dev port differs, and adds a pointless round-trip.
  const wb = await loadWorkbook(getWorkbookPath());
  const rows = topPicksByTopic(wb.discoveredItems, wb.topics, 3);

  return (
    <div>
      <p className="font-serif text-xl mb-4">This week&apos;s picks</p>
      {rows.map(({ topic, items }) => (
        <div key={topic.id} className="mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-invent-grey4">{topic.name}</span>
            <a
              href={`/catalog?topicId=${topic.id}`}
              className="text-xs text-invent-blue border-b border-transparent pb-0.5 transition-colors duration-180 hover:text-invent-light-blue hover:border-invent-light-blue"
            >
              See all &rarr;
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-invent-grey4 text-sm">
          No picks yet — the daily discovery run hasn&apos;t found anything, or hasn&apos;t run yet.
        </p>
      )}
    </div>
  );
}
