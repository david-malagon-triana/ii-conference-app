// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReportingPage from '../../../../app/admin/reporting/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ReportingPage', () => {
  it('renders all five reporting stats fields', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/api/catalog')) {
        return Promise.resolve({ ok: true, json: async () => ({ topics: [{ id: 't1', name: 'Data Strategy' }] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          stats: {
            interestByTopic: { t1: 3 },
            priceSplit: { FREE: 2, PAID: 1, UNKNOWN: 0 },
            tierDistribution: { FUNDAMENTALS: 1, BASICS: 1, ADVANCED: 1, EXPERT: 0 },
            pmNotifiedCount: 1,
            catalogGrowthByDay: { '2026-08-01': 3 },
          },
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ReportingPage />);

    await waitFor(() => expect(screen.getByText('Data Strategy: 3')).toBeInTheDocument());
    expect(screen.getByText(/Free 2, Paid 1, Unknown 0/)).toBeInTheDocument();
    expect(screen.getByText(/Fundamentals 1, Basics 1,/)).toBeInTheDocument();
    expect(screen.getByText('PM-notified count: 1')).toBeInTheDocument();
    expect(screen.getByText('2026-08-01: 3')).toBeInTheDocument();
  });

  it('shows an error message on a failed fetch instead of hanging on "Loading..."', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/api/catalog')) {
        return Promise.resolve({ ok: true, json: async () => ({ topics: [] }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: 'Invalid passcode' }) });
    }));

    render(<ReportingPage />);

    await waitFor(() => expect(screen.getByText('Invalid passcode')).toBeInTheDocument());
  });
});
