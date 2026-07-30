import { PriceStatus } from '@/lib/workbook/types';

export function PriceBadge({ priceStatus }: { priceStatus: PriceStatus }) {
  if (priceStatus === 'FREE') {
    return <span className="text-xs border border-invent-turquoise rounded-full px-2 py-0.5">Free</span>;
  }
  if (priceStatus === 'PAID') {
    return <span className="text-xs border border-invent-blue rounded-full px-2 py-0.5">Paid</span>;
  }
  return (
    <span className="text-xs border border-invent-yellow text-invent-yellow rounded-full px-2 py-0.5">
      ⚠ Price unknown
    </span>
  );
}
