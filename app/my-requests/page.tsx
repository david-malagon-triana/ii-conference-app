'use client';

import { useState } from 'react';

export default function MyRequestsPage() {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<any[] | null>(null);

  async function lookup() {
    const res = await fetch(`/api/my-requests?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setResults(data.items);
  }

  return (
    <div>
      <p className="text-base font-normal mb-3">My requests</p>
      <div className="flex gap-2 mb-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@capgemini.com"
          className="text-sm bg-transparent border border-slate-700 rounded px-2 py-1 flex-1"
        />
        <button onClick={lookup} className="text-sm border border-invent-blue rounded px-3 py-1">
          Look up
        </button>
      </div>
      {results?.map(({ request, item }) => (
        <div key={request.id} className="border border-slate-700 rounded-lg p-3 mb-2 text-sm">
          <p>{item?.title ?? 'Item no longer in catalog'}</p>
          <p className="text-invent-grey4 text-xs">
            {request.pmNotified ? `Your PM (${request.pmName}) was notified.` : 'Noted — attending.'}
          </p>
        </div>
      ))}
      {results?.length === 0 && <p className="text-invent-grey4 text-sm">No requests found for that email.</p>}
    </div>
  );
}
