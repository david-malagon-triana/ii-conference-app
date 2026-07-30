'use client';

import { useEffect, useState } from 'react';

export default function ReportingPage() {
  const [stats, setStats] = useState<{
    priceSplit: Record<'FREE' | 'PAID' | 'UNKNOWN', number>;
    tierDistribution: Record<'FUNDAMENTALS' | 'BASICS' | 'ADVANCED' | 'EXPERT', number>;
  } | null>(null);

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then(({ items }) => {
        // computeReportingStats (lib/reporting.ts) also derives interestByTopic and pmNotifiedCount,
        // but those require interestRequests, which /api/catalog does not expose (by design, since it's
        // the public catalog browse endpoint). Without a dedicated /api/admin/reporting route, this page
        // is limited to what's derivable from /api/catalog's items: price split and tier distribution.
        const priceSplit = { FREE: 0, PAID: 0, UNKNOWN: 0 };
        const tierDistribution = { FUNDAMENTALS: 0, BASICS: 0, ADVANCED: 0, EXPERT: 0 };
        for (const item of items) {
          priceSplit[item.priceStatus as 'FREE' | 'PAID' | 'UNKNOWN'] += 1;
          tierDistribution[item.tier as 'FUNDAMENTALS' | 'BASICS' | 'ADVANCED' | 'EXPERT'] += 1;
        }
        setStats({ priceSplit, tierDistribution });
      });
  }, []);

  if (!stats) return <p className="text-sm">Loading...</p>;

  return (
    <div>
      <p className="text-base font-normal mb-3">Reporting</p>
      <p className="text-sm mb-1">
        Price split: Free {stats.priceSplit.FREE}, Paid {stats.priceSplit.PAID}, Unknown {stats.priceSplit.UNKNOWN}
      </p>
      <p className="text-sm mb-3">
        Tier distribution: Fundamentals {stats.tierDistribution.FUNDAMENTALS}, Basics {stats.tierDistribution.BASICS},
        Advanced {stats.tierDistribution.ADVANCED}, Expert {stats.tierDistribution.EXPERT}
      </p>
      <p className="text-xs text-invent-grey4">
        Interest-by-topic and PM-notified counts require a dedicated admin reporting endpoint over
        interestRequests and are not yet shown here.
      </p>
    </div>
  );
}
