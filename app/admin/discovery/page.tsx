'use client';

import { useEffect, useState } from 'react';
import { SearchRunRow } from '@/lib/workbook/types';

export default function DiscoveryPage() {
  const [result, setResult] = useState<string>('');
  const [reminderResult, setReminderResult] = useState<string>('');
  const [runs, setRuns] = useState<SearchRunRow[]>([]);
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const [truncated, setTruncated] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [error, setError] = useState('');

  function passcode(): string {
    return (window as unknown as { __ADMIN_PASSCODE__?: string }).__ADMIN_PASSCODE__ ?? '';
  }

  function loadHistory() {
    fetch(`/api/admin/discovery/run?passcode=${encodeURIComponent(passcode())}`).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to load run history');
        return;
      }
      setRuns(data.runs);
      setTopicNames(data.topicNames ?? {});
      setTruncated(Boolean(data.truncated));
    });
  }

  function loadSchedule() {
    fetch(`/api/admin/settings?passcode=${encodeURIComponent(passcode())}`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setScheduleTime(data.settings?.discoveryScheduleTime ?? '');
    });
  }

  // Load once on mount. `loadHistory`/`loadSchedule` are recreated each render but only read
  // the passcode from `window`, so re-running the effect on identity change would be pointless.
  useEffect(() => {
    loadHistory();
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runNow() {
    setResult('Running...');
    const res = await fetch('/api/admin/discovery/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult(data.error);
      return;
    }
    const failed = data.alerts.length;
    setResult(
      `Done. ${failed} topic(s) failed.` +
        (failed > 0 && !data.alertEmailConfigured
          ? ' No system alert email is configured, so no alert was sent — set one under Settings.'
          : ''),
    );
    loadHistory();
  }

  async function saveSchedule() {
    setScheduleStatus('');
    setError('');
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode(), key: 'discoveryScheduleTime', value: scheduleTime }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save schedule');
      return;
    }
    setScheduleStatus('Saved');
  }

  async function runReminders() {
    setReminderResult('Running...');
    const res = await fetch('/api/admin/reminders/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode() }),
    });
    const data = await res.json();
    setReminderResult(res.ok ? `Done. ${data.remindersSent} reminder(s) sent.` : data.error);
  }

  return (
    <div>
      <p className="text-base font-normal mb-3">Discovery control</p>
      <p className="text-xs text-invent-orange mb-3 h-4">{error}</p>

      <button onClick={runNow} className="border border-invent-blue rounded px-3 py-1 text-sm mb-1">
        Run discovery now
      </button>
      <p className="text-sm mb-4">{result}</p>

      <label className="text-xs text-invent-grey4">
        Daily schedule (cron, e.g. <code>0 6 * * *</code>, or <code>06:00</code>)
      </label>
      <div className="flex gap-2 mb-1">
        <input
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          placeholder="0 6 * * *"
          className="border rounded px-2 py-1 text-sm bg-transparent"
        />
        <button onClick={saveSchedule} className="border rounded px-2 py-1 text-sm">
          Save
        </button>
        {scheduleStatus && <span className="text-xs text-invent-turquoise self-center">{scheduleStatus}</span>}
      </div>
      <p className="text-xs text-invent-grey4 mb-4">
        Only the hour is used by the in-process scheduler, compared against UTC.
      </p>

      <button onClick={runReminders} className="border border-invent-blue rounded px-3 py-1 text-sm mb-1">
        Send due reminders now
      </button>
      <p className="text-sm mb-4">{reminderResult}</p>

      <p className="text-sm font-normal mb-2">Run history</p>
      {truncated && (
        <p className="text-xs text-invent-grey4 mb-2">Showing most recent 50 runs.</p>
      )}
      {runs.length === 0 && <p className="text-sm text-invent-grey4">No discovery runs logged yet.</p>}
      {runs.map((run) => (
        <div key={run.id} className="text-xs border-b border-slate-700 py-1.5">
          <div className="flex justify-between gap-2">
            <span>
              {topicNames[run.topicId] ?? run.topicId} — {run.ranAt}
            </span>
            <span className={run.status === 'FAILED' ? 'text-invent-orange' : 'text-invent-turquoise'}>
              {run.status} — {run.itemsFound} found / {run.itemsAdded} added
            </span>
          </div>
          {run.errorNote && <p className="text-invent-orange">{run.errorNote}</p>}
        </div>
      ))}
    </div>
  );
}
