'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [reminderLeadDays, setReminderLeadDays] = useState('3');
  const [systemAlertEmail, setSystemAlertEmail] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  async function save(key: string, value: string) {
    setSaved('');
    setError('');
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: (window as any).__ADMIN_PASSCODE__, key, value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save setting');
      return;
    }
    setSaved(`Saved ${key}`);
  }

  return (
    <div>
      <p className="font-serif text-xl mb-3">Settings</p>

      <label className="text-xs text-invent-grey4">Reminder lead days</label>
      <div className="flex gap-2 mb-3">
        <input value={reminderLeadDays} onChange={(e) => setReminderLeadDays(e.target.value)} className="border rounded px-2 py-1 text-sm bg-transparent" />
        <button onClick={() => save('reminderLeadDays', reminderLeadDays)} className="rounded px-2 py-1 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]">Save</button>
      </div>

      <label className="text-xs text-invent-grey4">System alert email (CD lead)</label>
      <div className="flex gap-2 mb-3">
        <input value={systemAlertEmail} onChange={(e) => setSystemAlertEmail(e.target.value)} className="border rounded px-2 py-1 text-sm bg-transparent flex-1" />
        <button onClick={() => save('systemAlertEmail', systemAlertEmail)} className="rounded px-2 py-1 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]">Save</button>
      </div>

      <label className="text-xs text-invent-grey4">Admin passcode</label>
      <div className="flex gap-2 mb-3">
        <input value={adminPasscode} onChange={(e) => setAdminPasscode(e.target.value)} className="border rounded px-2 py-1 text-sm bg-transparent flex-1" />
        <button onClick={() => save('adminPasscode', adminPasscode)} className="rounded px-2 py-1 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]">Save</button>
      </div>
      <p className="text-xs text-invent-grey4 mb-3">
        Changing the admin passcode here takes effect immediately for future requests; re-enter it via
        Admin home after saving, since your current browser session still holds the old value.
      </p>

      {saved && <p className="text-xs text-invent-turquoise">{saved}</p>}
      {error && <p className="text-xs text-invent-orange">{error}</p>}
    </div>
  );
}
