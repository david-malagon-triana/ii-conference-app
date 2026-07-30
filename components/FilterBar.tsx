'use client';

import { Tier, ItemFormat, ItemType } from '@/lib/workbook/types';

export interface FilterValues {
  search: string;
  topicId: string;
  tier: Tier | '';
  format: ItemFormat | '';
  type: ItemType | '';
}

export function FilterBar({
  topics,
  values,
  onChange,
}: {
  topics: { id: string; name: string }[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <input
        value={values.search}
        onChange={(e) => onChange({ ...values, search: e.target.value })}
        placeholder="Search"
        className="text-sm bg-transparent border border-slate-700 rounded px-2 py-1"
      />
      <select
        value={values.topicId}
        onChange={(e) => onChange({ ...values, topicId: e.target.value })}
        className="text-sm bg-invent-dark-blue border border-slate-700 rounded px-2 py-1"
      >
        <option value="">Topic: All</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select
        value={values.tier}
        onChange={(e) => onChange({ ...values, tier: e.target.value as Tier | '' })}
        className="text-sm bg-invent-dark-blue border border-slate-700 rounded px-2 py-1"
      >
        <option value="">Tier: All</option>
        <option value="FUNDAMENTALS">Fundamentals</option>
        <option value="BASICS">Basics</option>
        <option value="ADVANCED">Advanced</option>
        <option value="EXPERT">Expert</option>
      </select>
      <select
        value={values.format}
        onChange={(e) => onChange({ ...values, format: e.target.value as ItemFormat | '' })}
        className="text-sm bg-invent-dark-blue border border-slate-700 rounded px-2 py-1"
      >
        <option value="">Format: All</option>
        <option value="ONLINE">Online</option>
        <option value="PHYSICAL">Physical</option>
      </select>
    </div>
  );
}
