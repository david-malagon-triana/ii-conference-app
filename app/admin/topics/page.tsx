'use client';

import { useEffect, useState } from 'react';
import { TopicRow } from '@/lib/workbook/types';

type Draft = { name: string; category: string; keywords: string };

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', category: '', keywords: '' });

  function passcode(): string {
    return (window as unknown as { __ADMIN_PASSCODE__?: string }).__ADMIN_PASSCODE__ ?? '';
  }

  function load() {
    fetch('/api/admin/topics')
      .then((r) => r.json())
      .then((d) => setTopics(d.topics));
  }
  useEffect(load, []);

  async function addTopic() {
    setError('');
    const res = await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode(), name, category, keywords }),
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

  function startEdit(topic: TopicRow) {
    setEditingId(topic.id);
    setDraft({ name: topic.name, category: topic.category, keywords: topic.keywords });
  }

  async function saveEdit(id: string) {
    setError('');
    const res = await fetch(`/api/admin/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode(), updates: draft }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to update topic');
      return;
    }
    setEditingId(null);
    load();
  }

  async function removeTopic(id: string, topicName: string) {
    if (!window.confirm(`Remove topic "${topicName}"? Discovered items already found stay in the catalog.`)) {
      return;
    }
    setError('');
    const res = await fetch(`/api/admin/topics/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to remove topic');
      return;
    }
    load();
  }

  return (
    <div>
      <p className="font-serif text-xl mb-3">Topics</p>
      <div className="flex gap-2 mb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="border rounded px-2 py-1 text-sm bg-transparent" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="border rounded px-2 py-1 text-sm bg-transparent" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords, comma-separated" className="border rounded px-2 py-1 text-sm bg-transparent flex-1" />
        <button
          onClick={addTopic}
          className="rounded px-3 py-1 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-invent-orange mb-3 h-4">{error}</p>
      {topics.map((t) => (
        <div key={t.id} className="text-sm border-b border-slate-700 py-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p>{t.name} <span className="text-invent-grey4">({t.category})</span></p>
              <p className="text-xs text-invent-grey4">{t.keywords}</p>
            </div>
            <span className="flex gap-2 shrink-0">
              <button
                onClick={() => (editingId === t.id ? setEditingId(null) : startEdit(t))}
                className="text-xs border rounded px-2 py-1 transition-colors duration-180 hover:border-invent-blue hover:bg-invent-blue/10"
              >
                {editingId === t.id ? 'Close' : 'Edit'}
              </button>
              <button
                onClick={() => removeTopic(t.id, t.name)}
                className="text-xs border border-invent-orange text-invent-orange rounded px-2 py-1 transition-colors duration-180 hover:bg-invent-orange/10"
              >
                Remove
              </button>
            </span>
          </div>

          {editingId === t.id && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Name"
                className="border rounded px-2 py-1 text-sm bg-transparent"
              />
              <input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Category"
                className="border rounded px-2 py-1 text-sm bg-transparent"
              />
              <input
                value={draft.keywords}
                onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
                placeholder="Keywords, comma-separated"
                className="border rounded px-2 py-1 text-sm bg-transparent flex-1"
              />
              <button
                onClick={() => saveEdit(t.id)}
                className="rounded px-3 py-1 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]"
              >
                Save
              </button>
            </div>
          )}
        </div>
      ))}
      {topics.length === 0 && <p className="text-sm text-invent-grey4">No topics yet.</p>}
    </div>
  );
}
