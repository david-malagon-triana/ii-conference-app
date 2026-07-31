// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceBadge } from '../../components/PriceBadge';

describe('PriceBadge', () => {
  it('renders Free with a turquoise border for FREE', () => {
    render(<PriceBadge priceStatus="FREE" />);
    expect(screen.getByText('Free')).toHaveClass('border-invent-turquoise');
  });

  it('renders Paid with a blue border for PAID', () => {
    render(<PriceBadge priceStatus="PAID" />);
    expect(screen.getByText('Paid')).toHaveClass('border-invent-blue');
  });

  it('renders the warning-flagged "Price unknown" state for UNKNOWN', () => {
    render(<PriceBadge priceStatus="UNKNOWN" />);
    const badge = screen.getByText(/Price unknown/);
    expect(badge.textContent).toContain('⚠');
    expect(badge).toHaveClass('border-invent-yellow');
  });
});
