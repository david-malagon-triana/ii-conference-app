'use client';

export default function SentEmailsPage() {
  const emails: any[] = [];

  return (
    <div>
      <p className="text-base font-normal mb-3">Sent emails log</p>
      <p className="text-xs text-invent-grey4 mb-3">
        Every simulated PM notification, reminder, and system alert appears here once the corresponding
        action has been triggered. Listing the log requires a dedicated passcode-gated admin endpoint over
        the workbook&apos;s sentEmails sheet, which is not yet exposed by any API route.
      </p>
      {emails.length === 0 && <p className="text-sm text-invent-grey4">No emails sent yet.</p>}
    </div>
  );
}
