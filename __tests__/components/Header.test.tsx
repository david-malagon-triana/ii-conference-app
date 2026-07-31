// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Header reads the current route via `usePathname()` to highlight the active nav link.
// Outside a real Next.js router tree that hook has no context to read from, so it's mocked
// per-test to return whichever path the test wants to simulate.
const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

import { Header } from '../../components/Header';

describe('Header', () => {
  it('renders the Capgemini Invent wordmark and all three nav links', () => {
    usePathnameMock.mockReturnValue('/');
    render(<Header />);
    expect(screen.getByText(/Capgemini Invent/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: 'My requests' })).toHaveAttribute('href', '/my-requests');
  });

  it('highlights Home as active when on /', () => {
    usePathnameMock.mockReturnValue('/');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Home' }).className).toContain('border-invent-blue');
    expect(screen.getByRole('link', { name: 'Catalog' }).className).toContain('border-transparent');
  });

  it('highlights Catalog as active when on /catalog', () => {
    usePathnameMock.mockReturnValue('/catalog');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Catalog' }).className).toContain('border-invent-blue');
    expect(screen.getByRole('link', { name: 'Home' }).className).toContain('border-transparent');
  });

  it('highlights My requests as active when on /my-requests', () => {
    usePathnameMock.mockReturnValue('/my-requests');
    render(<Header />);
    expect(screen.getByRole('link', { name: 'My requests' }).className).toContain('border-invent-blue');
    expect(screen.getByRole('link', { name: 'Home' }).className).toContain('border-transparent');
  });
});
