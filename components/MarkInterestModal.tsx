'use client';

import { useState } from 'react';
import { DiscoveredItemRow } from '@/lib/workbook/types';

export function MarkInterestModal({ item, onClose }: { item: DiscoveredItemRow; onClose: () => void }) {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [pmName, setPmName] = useState('');
  const [pmEmail, setPmEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const requiresPm = item.priceStatus !== 'FREE';

  async function submit() {
    if (requiresPm && (!pmName.trim() || !pmEmail.trim())) {
      setErrorMessage("Your PM's name and email are required");
      setStatus('error');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          employeeName,
          employeeEmail,
          ...(requiresPm ? { pmName, pmEmail } : {}),
        }),
      });
      if (res.ok) {
        setStatus('done');
      } else {
        const body = await res.json();
        setErrorMessage(body.error ?? 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMessage("Couldn't reach the server. Try again.");
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
      <div className="bg-invent-grey1 text-invent-dark-blue rounded-xl p-5 w-72">
        <p className="font-serif text-base mb-1">Mark interest</p>
        <p className="text-xs text-slate-600 mb-3">{item.title}</p>

        {status === 'done' ? (
          <p className="text-sm">
            {requiresPm ? 'Your PM has been notified.' : 'Noted — you\'re attending.'}
          </p>
        ) : (
          <>
            <label className="text-xs text-slate-600">Your name</label>
            <input
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full mb-2 border rounded px-2 py-1 text-sm"
              placeholder="Jane Doe"
            />
            <label className="text-xs text-slate-600">Your email</label>
            <input
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
              className="w-full mb-2 border rounded px-2 py-1 text-sm"
              placeholder="name@capgemini.com"
            />
            {requiresPm && (
              <>
                <label className="text-xs text-slate-600">Your PM's name</label>
                <input
                  value={pmName}
                  onChange={(e) => setPmName(e.target.value)}
                  className="w-full mb-2 border rounded px-2 py-1 text-sm"
                  placeholder="John Smith"
                />
                <label className="text-xs text-slate-600">Your PM's email</label>
                <input
                  value={pmEmail}
                  onChange={(e) => setPmEmail(e.target.value)}
                  className="w-full mb-3 border rounded px-2 py-1 text-sm"
                  placeholder="pm@capgemini.com"
                />
              </>
            )}
            {status === 'error' && <p className="text-xs text-red-600 mb-2">{errorMessage}</p>}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 border rounded py-1.5 text-sm transition-colors duration-180 hover:border-invent-blue hover:bg-invent-blue/10"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={status === 'sending'}
                className="flex-1 rounded py-1.5 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:saturate-100"
              >
                {requiresPm ? 'Notify PM' : 'Confirm'}
              </button>
            </div>
          </>
        )}
        {/* Always available: after a successful submission this is the only way out of the modal. */}
        <button
          onClick={onClose}
          className="text-xs text-slate-500 mt-2 block transition-colors duration-180 hover:text-invent-grey1"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
