'use client';

import { useState } from 'react';
import { DiscoveredItemRow } from '@/lib/workbook/types';
import { TierBadge } from './TierBadge';
import { PriceBadge } from './PriceBadge';
import { MarkInterestModal } from './MarkInterestModal';

export function ItemCard({ item }: { item: DiscoveredItemRow }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
      <TierBadge tier={item.tier} />
      <p className="text-sm mt-2 mb-1">{item.title}</p>
      {item.description && (
        <p className="text-xs text-invent-grey4 mb-1 line-clamp-2">{item.description}</p>
      )}
      <p className="text-xs text-invent-grey4 mb-1">
        {item.startDate ?? 'Date not found — check the official link'}
        {item.startDate && (item.location ? ` · ${item.location}` : item.format === 'ONLINE' ? ' · Online' : '')}
      </p>
      <p className="text-xs text-invent-grey4 mb-2">
        {item.duration ?? 'Duration not specified'}
      </p>
      <PriceBadge priceStatus={item.priceStatus} />
      <div className="flex gap-2 mt-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center border border-slate-600 text-invent-grey4 text-sm rounded-md py-1.5"
        >
          See more
        </a>
        <button
          onClick={() => setOpen(true)}
          className="flex-1 border border-invent-blue text-sm rounded-md py-1.5"
        >
          Mark interest
        </button>
      </div>
      {open && <MarkInterestModal item={item} onClose={() => setOpen(false)} />}
    </div>
  );
}
