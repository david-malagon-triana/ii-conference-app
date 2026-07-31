'use client';

import { useEffect, useState } from 'react';

interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  kind: string;
}

export default function SentEmailsPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const passcode = (window as any).__ADMIN_PASSCODE__ ?? '';
    fetch(`/api/admin/sent-emails?passcode=${encodeURIComponent(passcode)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to load sent emails');
          return;
        }
        setEmails(data.emails);
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <p className="font-serif text-xl mb-3">Sent emails log</p>
      <p className="text-xs text-invent-grey4 mb-3">
        Every simulated PM notification, reminder, and system alert appears here once the corresponding
        action has been triggered.
      </p>
      {error && <p className="text-xs text-invent-orange mb-3">{error}</p>}
      {loaded && !error && emails.length === 0 && (
        <p className="text-sm text-invent-grey4">No emails sent yet.</p>
      )}
      {emails
        .slice()
        .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))
        .map((email) => (
          <div key={email.id} className="text-sm border-b border-slate-700 py-2">
            <p>
              {email.subject} <span className="text-invent-grey4">({email.kind})</span>
            </p>
            <p className="text-xs text-invent-grey4">
              To: {email.to} &middot; {email.sentAt}
            </p>
            <p className="text-xs text-invent-grey4">{email.body.slice(0, 100)}{email.body.length > 100 ? '…' : ''}</p>
          </div>
        ))}
    </div>
  );
}
