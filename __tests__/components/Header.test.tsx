// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../components/Header';

describe('Header', () => {
  it('renders the Capgemini Invent wordmark and all three nav links', () => {
    render(<Header />);
    expect(screen.getByText(/Capgemini Invent/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: 'My requests' })).toHaveAttribute('href', '/my-requests');
  });
});
