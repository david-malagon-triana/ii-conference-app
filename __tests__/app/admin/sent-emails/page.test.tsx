// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SentEmailsPage from '../../../../app/admin/sent-emails/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SentEmailsPage', () => {
  it('renders a list of sent emails, newest first', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        emails: [
          { id: 'e1', to: 'pm@x.com', subject: 'Attendance request: Gen AI Summit', body: 'Hi John, ...', sentAt: '2026-08-01T00:00:00.000Z', kind: 'PM_NOTIFICATION' },
          { id: 'e2', to: 'jane@x.com', subject: 'Reminder: Gen AI Summit', body: 'Hi Jane, ...', sentAt: '2026-08-02T00:00:00.000Z', kind: 'REMINDER' },
        ],
      }),
    }));

    render(<SentEmailsPage />);

    await waitFor(() => expect(screen.getByText(/Attendance request: Gen AI Summit/)).toBeInTheDocument());
    const subjects = screen.getAllByText(/Gen AI Summit/).map((el) => el.textContent);
    expect(subjects[0]).toContain('Reminder'); // newest (2026-08-02) rendered first
  });

  it('shows "No emails sent yet." only after the fetch resolves with an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ emails: [] }) }));

    render(<SentEmailsPage />);

    expect(screen.queryByText('No emails sent yet.')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No emails sent yet.')).toBeInTheDocument());
  });

  it('shows an error message on a failed fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Invalid passcode' }) }));

    render(<SentEmailsPage />);

    await waitFor(() => expect(screen.getByText('Invalid passcode')).toBeInTheDocument());
  });
});
