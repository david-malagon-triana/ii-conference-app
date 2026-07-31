// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiscoveryPage from '../../../../app/admin/discovery/page';

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as any).__ADMIN_PASSCODE__;
});

describe('DiscoveryPage', () => {
  it('shows the "showing most recent 50 runs" note only when truncated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ runs: [], topicNames: {}, truncated: true, settings: {} }),
      }),
    );

    render(<DiscoveryPage />);

    await waitFor(() => expect(screen.getByText('Showing most recent 50 runs.')).toBeInTheDocument());
  });

  it('does not show the note when the run list is under the cap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ runs: [], topicNames: {}, truncated: false, settings: {} }),
      }),
    );

    render(<DiscoveryPage />);

    await waitFor(() => expect(screen.getByText('No discovery runs logged yet.')).toBeInTheDocument());
    expect(screen.queryByText('Showing most recent 50 runs.')).not.toBeInTheDocument();
  });

  it('renders a FAILED run with its error note', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          runs: [{ id: 'r1', topicId: 't1', ranAt: '2026-08-01T06:00:00.000Z', status: 'FAILED', itemsFound: 0, itemsAdded: 0, errorNote: 'API down' }],
          topicNames: { t1: 'Data Strategy' },
          truncated: false,
          settings: {},
        }),
      }),
    );

    render(<DiscoveryPage />);

    await waitFor(() => expect(screen.getByText('API down')).toBeInTheDocument());
    expect(screen.getByText(/Data Strategy/)).toBeInTheDocument();
  });

  it('runs discovery now, POSTing the passcode and showing the done message with the failed count', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ runs: [], topicNames: {}, truncated: false }) }) // initial loadHistory
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: {} }) }) // initial loadSchedule
      .mockResolvedValueOnce({ ok: true, json: async () => ({ alerts: ['t1', 't2'], alertEmailConfigured: true }) }) // POST run
      .mockResolvedValueOnce({ ok: true, json: async () => ({ runs: [], topicNames: {}, truncated: false }) }); // reload history
    vi.stubGlobal('fetch', fetchMock);
    (window as any).__ADMIN_PASSCODE__ = 'changeme';
    const user = userEvent.setup();

    render(<DiscoveryPage />);
    await waitFor(() => expect(screen.getByText('No discovery runs logged yet.')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Run discovery now' }));

    await waitFor(() => expect(screen.getByText(/Done\. 2 topic\(s\) failed\./)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/admin/discovery/run',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ passcode: 'changeme' }),
      }),
    );
  });

  it('shows the missing-alert-email note when a run has failures and no alert email is configured', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ runs: [], topicNames: {}, truncated: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ alerts: ['t1'], alertEmailConfigured: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ runs: [], topicNames: {}, truncated: false }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<DiscoveryPage />);
    await waitFor(() => expect(screen.getByText('No discovery runs logged yet.')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Run discovery now' }));

    await waitFor(() =>
      expect(
        screen.getByText(/No system alert email is configured/),
      ).toBeInTheDocument(),
    );
  });

  it('saves the schedule via POST and shows Saved on success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ runs: [], topicNames: {}, truncated: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }); // POST settings
    vi.stubGlobal('fetch', fetchMock);
    (window as any).__ADMIN_PASSCODE__ = 'changeme';
    const user = userEvent.setup();

    render(<DiscoveryPage />);
    await waitFor(() => expect(screen.getByText('No discovery runs logged yet.')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('0 6 * * *');
    await user.type(input, '0 7 * * *');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/admin/settings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ passcode: 'changeme', key: 'discoveryScheduleTime', value: '0 7 * * *' }),
      }),
    );
  });

  it('sends due reminders now, POSTing the passcode and showing the sent count', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ runs: [], topicNames: {}, truncated: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ remindersSent: 4 }) });
    vi.stubGlobal('fetch', fetchMock);
    (window as any).__ADMIN_PASSCODE__ = 'changeme';
    const user = userEvent.setup();

    render(<DiscoveryPage />);
    await waitFor(() => expect(screen.getByText('No discovery runs logged yet.')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Send due reminders now' }));

    await waitFor(() => expect(screen.getByText(/Done\. 4 reminder\(s\) sent\./)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/admin/reminders/run',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ passcode: 'changeme' }),
      }),
    );
  });
});
