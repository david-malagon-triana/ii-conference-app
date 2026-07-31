'use client';

import { useState } from 'react';
import { DiscoveredItemRow } from '@/lib/workbook/types';
import { TierBadge } from './TierBadge';
import { PriceBadge } from './PriceBadge';
import { MarkInterestModal } from './MarkInterestModal';

export function ItemCard({ item }: { item: DiscoveredItemRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="ii-card-hover bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col h-full">
        <TierBadge tier={item.tier} />
        <p className="font-serif text-sm mt-2 mb-1">{item.title}</p>
        {item.description && (
          <p className="text-xs text-invent-grey4 mb-1 line-clamp-2">{item.description}</p>
        )}
        <p className="text-xs text-invent-grey4 mb-1">
          {item.startDate ?? 'Date not found — check the official link'}
          {item.location ? ` · ${item.location}` : item.format === 'ONLINE' ? ' · Online' : ''}
        </p>
        <p className="text-xs text-invent-grey4 mb-2 flex-grow">
          {item.duration ?? 'Duration not specified'}
        </p>
        <PriceBadge priceStatus={item.priceStatus} />
        <div className="flex gap-2 mt-auto pt-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center border border-slate-600 text-invent-grey4 text-sm rounded-md py-1.5 transition-colors duration-180 hover:border-invent-light-blue hover:bg-invent-light-blue/10"
          >
            See more
          </a>
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-md py-1.5 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]"
          >
            Mark interest
          </button>
        </div>
      </div>
      {open && <MarkInterestModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
