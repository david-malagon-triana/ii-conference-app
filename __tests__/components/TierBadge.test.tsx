// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../../components/TierBadge';

describe('TierBadge', () => {
  it('renders the Fundamentals label and color class', () => {
    render(<TierBadge tier="FUNDAMENTALS" />);
    const badge = screen.getByText('Fundamentals');
    expect(badge).toHaveClass('bg-tier-fundamentals');
  });

  it('renders the Basics label and color class', () => {
    render(<TierBadge tier="BASICS" />);
    expect(screen.getByText('Basics')).toHaveClass('bg-tier-basics');
  });

  it('renders the Advanced label and color class', () => {
    render(<TierBadge tier="ADVANCED" />);
    expect(screen.getByText('Advanced')).toHaveClass('bg-tier-advanced');
  });

  it('renders the Expert label and color class', () => {
    render(<TierBadge tier="EXPERT" />);
    expect(screen.getByText('Expert')).toHaveClass('bg-tier-expert');
  });
});
