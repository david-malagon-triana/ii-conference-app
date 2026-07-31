// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemCard } from '../../components/ItemCard';
import { DiscoveredItemRow } from '../../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow> = {}): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Fundamentals', type: 'COURSE', provider: '', url: 'https://example.com/course',
    description: 'An introduction to Gen AI', format: 'ONLINE', location: '', startDate: '2026-09-01',
    endDate: null, duration: '2 hours', priceStatus: 'FREE', tier: 'FUNDAMENTALS', tierRationale: '',
    relevanceScore: 0.8, speakersCompanies: '', active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
    ...overrides,
  };
}

describe('ItemCard', () => {
  it('renders title, description, date, duration, tier and price badges', () => {
    render(<ItemCard item={item()} />);
    expect(screen.getByText('Gen AI Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('An introduction to Gen AI')).toBeInTheDocument();
    expect(screen.getByText(/2026-09-01/)).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();
    expect(screen.getByText('Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows the null-startDate fallback text', () => {
    render(<ItemCard item={item({ startDate: null })} />);
    expect(screen.getByText('Date not found — check the official link')).toBeInTheDocument();
  });

  it('shows the null-duration fallback text', () => {
    render(<ItemCard item={item({ duration: null })} />);
    expect(screen.getByText('Duration not specified')).toBeInTheDocument();
  });

  it('renders a "See more" link pointing at the item URL', () => {
    render(<ItemCard item={item()} />);
    const link = screen.getByRole('link', { name: 'See more' });
    expect(link).toHaveAttribute('href', 'https://example.com/course');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('opens the Mark Interest modal when "Mark interest" is clicked', async () => {
    const user = userEvent.setup();
    render(<ItemCard item={item()} />);
    await user.click(screen.getByRole('button', { name: 'Mark interest' }));
    expect(screen.getByText('Your name')).toBeInTheDocument();
  });
});
