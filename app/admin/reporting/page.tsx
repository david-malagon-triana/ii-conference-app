'use client';

import { useEffect, useState } from 'react';
import type { ReportingStats } from '@/lib/reporting';

export default function ReportingPage() {
  const [stats, setStats] = useState<ReportingStats | null>(null);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then(({ topics }) => setTopics(topics));

    const passcode = (window as any).__ADMIN_PASSCODE__ ?? '';
    fetch(`/api/admin/reporting?passcode=${encodeURIComponent(passcode)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to load reporting stats');
          return;
        }
        setStats(data.stats);
      });
  }, []);

  function topicName(topicId: string) {
    return topics.find((t) => t.id === topicId)?.name ?? topicId;
  }

  if (error) return <p className="text-sm text-invent-orange">{error}</p>;
  if (!stats) return <p className="text-sm">Loading...</p>;

  const growthDays = Object.keys(stats.catalogGrowthByDay).sort();
  const interestTopicIds = Object.keys(stats.interestByTopic);

  return (
    <div>
      <p className="font-serif text-xl mb-3">Reporting</p>

      <p className="font-serif text-sm mb-1">Interest by topic</p>
      {interestTopicIds.length === 0 && <p className="text-xs text-invent-grey4 mb-3">No interest requests yet.</p>}
      {interestTopicIds.length > 0 && (
        <div className="mb-3">
          {interestTopicIds.map((topicId) => (
            <p key={topicId} className="text-sm">
              {topicName(topicId)}: {stats.interestByTopic[topicId]}
            </p>
          ))}
        </div>
      )}

      <p className="text-sm mb-1">
        Price split: Free {stats.priceSplit.FREE}, Paid {stats.priceSplit.PAID}, Unknown {stats.priceSplit.UNKNOWN}
      </p>
      <p className="text-sm mb-3">
        Tier distribution: Fundamentals {stats.tierDistribution.FUNDAMENTALS}, Basics {stats.tierDistribution.BASICS},
        Advanced {stats.tierDistribution.ADVANCED}, Expert {stats.tierDistribution.EXPERT}
      </p>

      <p className="text-sm mb-3">PM-notified count: {stats.pmNotifiedCount}</p>

      <p className="font-serif text-sm mb-1">Catalog growth by day</p>
      {growthDays.length === 0 && <p className="text-xs text-invent-grey4">No catalog items yet.</p>}
      {growthDays.map((day) => (
        <p key={day} className="text-sm">
          {day}: {stats.catalogGrowthByDay[day]}
        </p>
      ))}
    </div>
  );
}
