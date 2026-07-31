// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';

// Recharts renders complex SVG that jsdom can't meaningfully lay out (ResponsiveContainer
// measures a real DOM size, which jsdom always reports as 0x0), so the whole module is
// mocked to simple stand-ins that expose each chart's `data` prop as JSON text via a
// data-testid — this verifies the right data reaches each chart without needing real SVG
// rendering.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <>{children}</>,
  BarChart: ({ data, children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      {JSON.stringify(data)}
      {children}
    </div>
  ),
  LineChart: ({ data, children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      {JSON.stringify(data)}
      {children}
    </div>
  ),
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ data, 'data-testid': testId }: any) => <div data-testid={testId}>{JSON.stringify(data)}</div>,
  Bar: () => null,
  Line: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ReportingPage from '../../../../app/admin/reporting/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

const FULL_STATS = {
  interestByTopic: { t1: 3 },
  priceSplit: { FREE: 2, PAID: 1, UNKNOWN: 0 },
  tierDistribution: { FUNDAMENTALS: 1, BASICS: 1, ADVANCED: 1, EXPERT: 0 },
  pmNotifiedCount: 1,
  catalogGrowthByDay: { '2026-08-01': 3 },
  topItems: [{ itemId: 'i1', title: 'Gen AI Fundamentals', count: 3 }],
  uniqueEmployeeCount: 2,
  interestTrendByWeek: { '2026-08-03': 3 },
};

describe('ReportingPage', () => {
  it('renders every reporting stat, including the new metrics', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/api/catalog')) {
        return Promise.resolve({ ok: true, json: async () => ({ topics: [{ id: 't1', name: 'Data Strategy' }] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ stats: FULL_STATS }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ReportingPage />);

    await waitFor(() => expect(screen.getByTestId('top-items-chart')).toBeInTheDocument());

    expect(screen.getByTestId('top-items-chart').textContent).toContain('Gen AI Fundamentals');
    expect(screen.getByTestId('interest-trend-chart').textContent).toContain('2026-08-03');
    expect(screen.getByTestId('topic-interest-chart').textContent).toContain('Data Strategy');
    expect(screen.getByTestId('tier-distribution-chart').textContent).toContain('Fundamentals');
    expect(screen.getByTestId('catalog-growth-chart').textContent).toContain('2026-08-01');
    expect(screen.getByTestId('price-split-chart').textContent).toContain('Free');

    expect(within(screen.getByTestId('pm-notified-stat')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('unique-employees-stat')).getByText('2')).toBeInTheDocument();
  });

  it('shows "no data yet" messages instead of empty charts when there is no interest data', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/api/catalog')) {
        return Promise.resolve({ ok: true, json: async () => ({ topics: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          stats: {
            interestByTopic: {},
            priceSplit: { FREE: 0, PAID: 0, UNKNOWN: 0 },
            tierDistribution: { FUNDAMENTALS: 0, BASICS: 0, ADVANCED: 0, EXPERT: 0 },
            pmNotifiedCount: 0,
            catalogGrowthByDay: {},
            topItems: [],
            uniqueEmployeeCount: 0,
            interestTrendByWeek: {},
          },
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ReportingPage />);

    await waitFor(() => expect(screen.getByText('No items have received interest yet.')).toBeInTheDocument());
    expect(screen.getAllByText('No interest requests yet.')).toHaveLength(2); // topic-interest section + trend section
    expect(screen.getByText('No catalog items yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('top-items-chart')).not.toBeInTheDocument();
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
