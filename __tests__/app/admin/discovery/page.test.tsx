// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DiscoveryPage from '../../../../app/admin/discovery/page';

afterEach(() => {
  vi.unstubAllGlobals();
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
});
