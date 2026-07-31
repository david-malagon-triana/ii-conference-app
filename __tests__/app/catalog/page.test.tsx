// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `useSearchParams()` reads from a React context (`SearchParamsContext`) that Next.js's router
// normally provides. Under a plain `render()` with no router in the tree, that context defaults
// to `null`, and `page.tsx`'s `searchParams.get('topicId')` throws. Mocking the hook to return an
// empty `URLSearchParams` is the standard way to unit-test a client component that depends on it,
// without needing to pull in Next.js's full app-router test harness.
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import CatalogPage from '../../../app/catalog/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

const catalogResponse = {
  items: [
    {
      id: '1', title: 'Gen AI Fundamentals', type: 'COURSE', provider: '', url: 'https://example.com/1',
      description: '', format: 'ONLINE', location: '', startDate: '2026-09-01', endDate: null,
      duration: null, priceStatus: 'FREE', tier: 'FUNDAMENTALS', tierRationale: '', relevanceScore: 0.9,
      speakersCompanies: '', active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
    },
  ],
  topics: [{ id: 't1', name: 'Data Strategy' }],
};

describe('CatalogPage', () => {
  it('renders items and topics from the initial fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => catalogResponse });
    vi.stubGlobal('fetch', fetchMock);

    render(<CatalogPage />);

    await waitFor(() => expect(screen.getByText('Gen AI Fundamentals')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/catalog?'));
  });

  it('re-fetches with the search query string when the search box is used', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => catalogResponse });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<CatalogPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.type(screen.getByPlaceholderText('Search'), 'gen ai');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('search=gen')),
    );
  });

  it('shows "No matching items." when the catalog returns an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [], topics: [] }) }));

    render(<CatalogPage />);

    await waitFor(() => expect(screen.getByText('No matching items.')).toBeInTheDocument());
  });
});
