// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyRequestsPage from '../../../app/my-requests/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MyRequestsPage', () => {
  it('shows nothing before a lookup is performed', () => {
    render(<MyRequestsPage />);
    expect(screen.queryByText(/No requests found/)).not.toBeInTheDocument();
  });

  it('renders matching requests, distinguishing PM-notified from free-attending', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { request: { id: 'r1', pmNotified: true, pmName: 'John Smith' }, item: { title: 'Paid Course' } },
          { request: { id: 'r2', pmNotified: false }, item: { title: 'Free Webinar' } },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<MyRequestsPage />);
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'jane@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Look up' }));

    await waitFor(() => expect(screen.getByText('Paid Course')).toBeInTheDocument());
    expect(screen.getByText('Your PM (John Smith) was notified.')).toBeInTheDocument();
    expect(screen.getByText('Free Webinar')).toBeInTheDocument();
    expect(screen.getByText('Noted — attending.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`/api/my-requests?email=${encodeURIComponent('jane@capgemini.com')}`);
  });

  it('shows the empty-results state distinctly from not-yet-searched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));
    const user = userEvent.setup();

    render(<MyRequestsPage />);
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'nobody@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Look up' }));

    await waitFor(() => expect(screen.getByText('No requests found for that email.')).toBeInTheDocument());
  });

  it('shows an error message on a non-OK response instead of failing silently', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'email query parameter is required' }) }),
    );
    const user = userEvent.setup();

    render(<MyRequestsPage />);
    await user.click(screen.getByRole('button', { name: 'Look up' }));

    await waitFor(() => expect(screen.getByText('email query parameter is required')).toBeInTheDocument());
  });
});
