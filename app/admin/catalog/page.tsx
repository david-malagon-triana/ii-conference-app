'use client';

import { useEffect, useState } from 'react';

export default function CatalogModerationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  function load() {
    const passcode = (window as any).__ADMIN_PASSCODE__ ?? '';
    fetch(`/api/admin/catalog?passcode=${encodeURIComponent(passcode)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to load catalog');
          return;
        }
        setItems(data.items);
      });
  }
  useEffect(load, []);

  async function toggleActive(id: string, active: boolean) {
    setError('');
    const res = await fetch(`/api/admin/catalog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: (window as any).__ADMIN_PASSCODE__, updates: { active: !active } }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to update item');
      return;
    }
    load();
  }

  return (
    <div>
      <p className="text-base font-normal mb-3">Catalog moderation</p>
      <p className="text-xs text-invent-grey4 mb-3">
        Lists every catalog item, active and hidden, so hidden items can be unhidden here.
      </p>
      <p className="text-xs text-invent-orange mb-3 h-4">{error}</p>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-700 py-2">
          <span>
            {item.title} — {item.tier} — {item.priceStatus}
            {!item.active && <span className="text-invent-orange"> — hidden</span>}
          </span>
          <button onClick={() => toggleActive(item.id, item.active)} className="text-xs border rounded px-2 py-1">
            {item.active ? 'Hide' : 'Unhide'}
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-invent-grey4">No catalog items.</p>}
    </div>
  );
}
