'use client';

import { useState } from 'react';

export default function MyRequestsPage() {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function lookup() {
    setErrorMessage('');
    try {
      const res = await fetch(`/api/my-requests?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResults(null);
        setErrorMessage(body.error ?? 'Something went wrong');
        return;
      }
      const data = await res.json();
      setResults(data.items);
    } catch {
      setResults(null);
      setErrorMessage("Couldn't reach the server. Try again.");
    }
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
      {errorMessage && <p className="text-xs text-red-600 mb-2">{errorMessage}</p>}
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
