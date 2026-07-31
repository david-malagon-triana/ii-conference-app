'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ItemCard } from '@/components/ItemCard';
import { FilterBar, FilterValues } from '@/components/FilterBar';

// `useSearchParams()` forces a client-side bailout during prerendering, so the component that
// reads it must sit under a Suspense boundary or `next build` fails on this route.
export default function CatalogPage() {
  return (
    <Suspense fallback={<p className="text-invent-grey4 text-sm">Loading catalog...</p>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [values, setValues] = useState<FilterValues>({
    search: '',
    topicId: searchParams.get('topicId') ?? '',
    tier: '',
    format: '',
    type: '',
    dateRange: '',
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (values.search) params.set('search', values.search);
    if (values.topicId) params.set('topicId', values.topicId);
    if (values.tier) params.set('tier', values.tier);
    if (values.format) params.set('format', values.format);
    if (values.type) params.set('type', values.type);
    if (values.dateRange) {
      const days = parseInt(values.dateRange, 10);
      const dateFrom = new Date();
      const dateTo = new Date(Date.now() + days * 86400000);
      params.set('dateFrom', dateFrom.toISOString());
      params.set('dateTo', dateTo.toISOString());
    }

    fetch(`/api/catalog?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items);
        setTopics(data.topics);
      });
  }, [values]);

  return (
    <div>
      <p className="font-serif text-xl mb-3">Catalog</p>
      <FilterBar topics={topics} values={values} onChange={setValues} />
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      {items.length === 0 && <p className="text-invent-grey4 text-sm">No matching items.</p>}
    </div>
  );
}
