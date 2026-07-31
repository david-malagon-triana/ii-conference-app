// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { emptyWorkbook, DiscoveredItemRow, TopicRow } from '../../lib/workbook/types';

vi.mock('../../lib/workbook/store', () => ({
  loadWorkbook: vi.fn(),
}));

import { loadWorkbook } from '../../lib/workbook/store';
import HomePage from '../../app/page';

function item(overrides: Partial<DiscoveredItemRow> = {}): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Fundamentals', type: 'COURSE', provider: '', url: '', description: '',
    format: 'ONLINE', location: '', startDate: '2026-09-01', endDate: null, duration: null,
    priceStatus: 'FREE', tier: 'FUNDAMENTALS', tierRationale: '', relevanceScore: 0.9, speakersCompanies: '',
    active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
    ...overrides,
  };
}

const topic: TopicRow = { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: '' };

afterEach(() => {
  vi.mocked(loadWorkbook).mockReset();
});

describe('HomePage', () => {
  it('renders a topic row with its top item when the workbook has data', async () => {
    const wb = emptyWorkbook();
    wb.topics = [topic];
    wb.discoveredItems = [item()];
    vi.mocked(loadWorkbook).mockResolvedValue(wb);

    render(await HomePage());

    expect(screen.getByText('Data Strategy')).toBeInTheDocument();
    expect(screen.getByText('Gen AI Fundamentals')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See all/ })).toHaveAttribute('href', '/catalog?topicId=t1');
  });

  it('shows "No picks yet" when the workbook has no discovered items', async () => {
    vi.mocked(loadWorkbook).mockResolvedValue(emptyWorkbook());

    render(await HomePage());

    expect(screen.getByText(/No picks yet/)).toBeInTheDocument();
  });
});
