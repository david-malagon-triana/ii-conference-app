'use client';

import { useEffect, useState } from 'react';
import { PRICE_STATUSES, TIERS } from '@/lib/admin/catalogUpdates';
import { DiscoveredItemRow } from '@/lib/workbook/types';

type Draft = { tier: string; priceStatus: string; startDate: string };

export default function CatalogModerationPage() {
  const [items, setItems] = useState<DiscoveredItemRow[]>([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ tier: '', priceStatus: '', startDate: '' });

  function passcode(): string {
    return (window as unknown as { __ADMIN_PASSCODE__?: string }).__ADMIN_PASSCODE__ ?? '';
  }

  function load() {
    fetch(`/api/admin/catalog?passcode=${encodeURIComponent(passcode())}`).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load catalog');
        return;
      }
      setItems(data.items);
    });
  }
  useEffect(load, []);

  async function patch(id: string, updates: Record<string, unknown>) {
    setError('');
    const res = await fetch(`/api/admin/catalog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode(), updates }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to update item');
      return false;
    }
    load();
    return true;
  }

  async function removeItem(id: string, title: string) {
    if (!window.confirm(`Delete "${title}" permanently? This cannot be undone.`)) return;
    setError('');
    const res = await fetch(`/api/admin/catalog/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to delete item');
      return;
    }
    load();
  }

  function startEdit(item: DiscoveredItemRow) {
    setEditingId(item.id);
    setDraft({ tier: item.tier, priceStatus: item.priceStatus, startDate: item.startDate ?? '' });
  }

  async function saveEdit(id: string) {
    const ok = await patch(id, {
      tier: draft.tier,
      priceStatus: draft.priceStatus,
      startDate: draft.startDate.trim() === '' ? null : draft.startDate.trim(),
    });
    if (ok) setEditingId(null);
  }

  return (
    <div>
      <p className="font-serif text-xl mb-3">Catalog moderation</p>
      <p className="text-xs text-invent-grey4 mb-3">
        Lists every catalog item, active and hidden. Hide/unhide is reversible; edit corrects the
        classifier&apos;s guesses at tier, price and start date; delete removes the item permanently.
      </p>
      <p className="text-xs text-invent-orange mb-3 h-4">{error}</p>
      {items.map((item) => (
        <div key={item.id} className="text-sm border-b border-slate-700 py-2">
          <div className="flex justify-between items-center gap-2">
            <span>
              {item.title} — {item.tier} — {item.priceStatus}
              {item.startDate ? ` — ${item.startDate}` : ' — no date'}
              {!item.active && <span className="text-invent-orange"> — hidden</span>}
            </span>
            <span className="flex gap-2 shrink-0">
              <button
                onClick={() => (editingId === item.id ? setEditingId(null) : startEdit(item))}
                className="text-xs border rounded px-2 py-1 transition-colors duration-180 hover:border-invent-light-blue hover:bg-invent-light-blue/10"
              >
                {editingId === item.id ? 'Close' : 'Edit'}
              </button>
              <button
                onClick={() => patch(item.id, { active: !item.active })}
                className="text-xs border rounded px-2 py-1 transition-colors duration-180 hover:border-invent-light-blue hover:bg-invent-light-blue/10"
              >
                {item.active ? 'Hide' : 'Unhide'}
              </button>
              <button
                onClick={() => removeItem(item.id, item.title)}
                className="text-xs border border-invent-orange text-invent-orange rounded px-2 py-1 transition-colors duration-180 hover:bg-invent-orange/10"
              >
                Delete
              </button>
            </span>
          </div>

          {editingId === item.id && (
            <div className="flex gap-2 items-end mt-2 flex-wrap">
              <label className="text-xs text-invent-grey4 flex flex-col">
                Tier
                <select
                  value={draft.tier}
                  onChange={(e) => setDraft({ ...draft, tier: e.target.value })}
                  className="border rounded px-2 py-1 text-sm bg-transparent"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t} className="text-invent-dark-blue">
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-invent-grey4 flex flex-col">
                Price
                <select
                  value={draft.priceStatus}
                  onChange={(e) => setDraft({ ...draft, priceStatus: e.target.value })}
                  className="border rounded px-2 py-1 text-sm bg-transparent"
                >
                  {PRICE_STATUSES.map((p) => (
                    <option key={p} value={p} className="text-invent-dark-blue">
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-invent-grey4 flex flex-col">
                Start date (YYYY-MM-DD, blank for none)
                <input
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                  placeholder="2026-09-12"
                  className="border rounded px-2 py-1 text-sm bg-transparent"
                />
              </label>
              <button
                onClick={() => saveEdit(item.id)}
                className="rounded px-3 py-1 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]"
              >
                Save
              </button>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-invent-grey4">No catalog items.</p>}
    </div>
  );
}
