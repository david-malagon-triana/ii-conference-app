'use client';

import { useEffect, useState } from 'react';

export default function TopicsPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');

  function load() {
    fetch('/api/admin/topics').then((r) => r.json()).then((d) => setTopics(d.topics));
  }
  useEffect(load, []);

  async function addTopic() {
    setError('');
    const res = await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: (window as any).__ADMIN_PASSCODE__, name, category, keywords }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to add topic');
      return;
    }
    setName('');
    setCategory('');
    setKeywords('');
    load();
  }

  return (
    <div>
      <p className="text-base font-normal mb-3">Topics</p>
      <div className="flex gap-2 mb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="border rounded px-2 py-1 text-sm bg-transparent" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="border rounded px-2 py-1 text-sm bg-transparent" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords, comma-separated" className="border rounded px-2 py-1 text-sm bg-transparent flex-1" />
        <button onClick={addTopic} className="border border-invent-blue rounded px-3 py-1 text-sm">Add</button>
      </div>
      <p className="text-xs text-invent-orange mb-3 h-4">{error}</p>
      {topics.map((t) => (
        <div key={t.id} className="text-sm border-b border-slate-700 py-2">
          <p>{t.name} <span className="text-invent-grey4">({t.category})</span></p>
          <p className="text-xs text-invent-grey4">{t.keywords}</p>
        </div>
      ))}
    </div>
  );
}
