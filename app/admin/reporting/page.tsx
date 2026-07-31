'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ReportingStats } from '@/lib/reporting';

const BRAND_BLUE = '#0058AB';
const BRAND_LIGHT_BLUE = '#1DB8F2';

const PRICE_COLORS: Record<'FREE' | 'PAID' | 'UNKNOWN', string> = {
  FREE: '#00D5D0',
  PAID: '#0058AB',
  UNKNOWN: '#FEB100',
};

const TIER_LABELS: Record<string, string> = {
  FUNDAMENTALS: 'Fundamentals',
  BASICS: 'Basics',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

const TIER_COLORS: Record<string, string> = {
  FUNDAMENTALS: '#B8E8FB',
  BASICS: '#1DB8F2',
  ADVANCED: '#0058AB',
  EXPERT: '#04122B',
};

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
  const trendWeeks = Object.keys(stats.interestTrendByWeek).sort();

  const topicInterestData = interestTopicIds.map((id) => ({ name: topicName(id), value: stats.interestByTopic[id] }));
  const priceSplitData = [
    { name: 'Free', value: stats.priceSplit.FREE, color: PRICE_COLORS.FREE },
    { name: 'Paid', value: stats.priceSplit.PAID, color: PRICE_COLORS.PAID },
    { name: 'Unknown', value: stats.priceSplit.UNKNOWN, color: PRICE_COLORS.UNKNOWN },
  ];
  const tierData = ['FUNDAMENTALS', 'BASICS', 'ADVANCED', 'EXPERT'].map((tier) => ({
    name: TIER_LABELS[tier],
    value: stats.tierDistribution[tier],
    color: TIER_COLORS[tier],
  }));
  const growthData = growthDays.map((day) => ({ day, value: stats.catalogGrowthByDay[day] }));
  const topItemsData = stats.topItems.map((t) => ({ name: t.title, value: t.count }));
  const trendData = trendWeeks.map((week) => ({ week, value: stats.interestTrendByWeek[week] }));

  return (
    <div>
      <p className="font-serif text-xl mb-3">Reporting</p>

      <div className="flex gap-6 mb-6">
        <div data-testid="pm-notified-stat">
          <p className="font-serif text-3xl">{stats.pmNotifiedCount}</p>
          <p className="text-xs text-invent-grey4">PM-notified</p>
        </div>
        <div data-testid="unique-employees-stat">
          <p className="font-serif text-3xl">{stats.uniqueEmployeeCount}</p>
          <p className="text-xs text-invent-grey4">Unique engaged employees</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-slate-700 rounded-lg p-4">
          <p className="font-serif text-sm mb-2">Top items by interest</p>
          {topItemsData.length === 0 ? (
            <p className="text-xs text-invent-grey4">No items have received interest yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={topItemsData} data-testid="top-items-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3459" />
                <XAxis type="number" stroke="#ADB8C2" />
                <YAxis type="category" dataKey="name" width={140} stroke="#ADB8C2" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={BRAND_BLUE} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-slate-700 rounded-lg p-4">
          <p className="font-serif text-sm mb-2">Interest trend by week</p>
          {trendData.length === 0 ? (
            <p className="text-xs text-invent-grey4">No interest requests yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData} data-testid="interest-trend-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3459" />
                <XAxis dataKey="week" stroke="#ADB8C2" tick={{ fontSize: 11 }} />
                <YAxis stroke="#ADB8C2" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={BRAND_LIGHT_BLUE} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-slate-700 rounded-lg p-4">
          <p className="font-serif text-sm mb-2">Interest by topic</p>
          {topicInterestData.length === 0 ? (
            <p className="text-xs text-invent-grey4">No interest requests yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={topicInterestData} data-testid="topic-interest-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3459" />
                <XAxis type="number" stroke="#ADB8C2" />
                <YAxis type="category" dataKey="name" width={140} stroke="#ADB8C2" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={BRAND_BLUE} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-slate-700 rounded-lg p-4">
          <p className="font-serif text-sm mb-2">Price split</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={priceSplitData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} data-testid="price-split-chart">
                {priceSplitData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-slate-700 rounded-lg p-4">
          <p className="font-serif text-sm mb-2">Tier distribution</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tierData} data-testid="tier-distribution-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3459" />
              <XAxis dataKey="name" stroke="#ADB8C2" tick={{ fontSize: 11 }} />
              <YAxis stroke="#ADB8C2" />
              <Tooltip />
              <Bar dataKey="value">
                {tierData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-slate-700 rounded-lg p-4">
          <p className="font-serif text-sm mb-2">Catalog growth by day</p>
          {growthData.length === 0 ? (
            <p className="text-xs text-invent-grey4">No catalog items yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData} data-testid="catalog-growth-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3459" />
                <XAxis dataKey="day" stroke="#ADB8C2" tick={{ fontSize: 11 }} />
                <YAxis stroke="#ADB8C2" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={BRAND_LIGHT_BLUE} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
