'use client';

import { useState } from 'react';

export default function DiscoveryPage() {
  const [result, setResult] = useState<string>('');
  const [reminderResult, setReminderResult] = useState<string>('');

  async function runNow() {
    setResult('Running...');
    const res = await fetch('/api/admin/discovery/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: (window as any).__ADMIN_PASSCODE__ }),
    });
    const data = await res.json();
    setResult(res.ok ? `Done. ${data.alerts.length} topic(s) failed.` : data.error);
  }

  async function runReminders() {
    setReminderResult('Running...');
    const res = await fetch('/api/admin/reminders/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: (window as any).__ADMIN_PASSCODE__ }),
    });
    const data = await res.json();
    setReminderResult(res.ok ? `Done. ${data.remindersSent} reminder(s) sent.` : data.error);
  }

  return (
    <div>
      <p className="text-base font-normal mb-3">Discovery control</p>
      <button onClick={runNow} className="border border-invent-blue rounded px-3 py-1 text-sm mb-1">
        Run discovery now
      </button>
      <p className="text-sm mb-3">{result}</p>

      <button onClick={runReminders} className="border border-invent-blue rounded px-3 py-1 text-sm mb-1">
        Send due reminders now
      </button>
      <p className="text-sm">{reminderResult}</p>
    </div>
  );
}
