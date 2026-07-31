// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CatalogModerationPage from '../../../../app/admin/catalog/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

const activeItem = {
  id: '1', title: 'Gen AI Fundamentals', tier: 'FUNDAMENTALS', priceStatus: 'FREE', startDate: '2026-09-01',
  active: true,
};
const hiddenItem = {
  id: '2', title: 'Old Webinar', tier: 'BASICS', priceStatus: 'FREE', startDate: null, active: false,
};

describe('CatalogModerationPage', () => {
  it('lists both active and hidden items, marking hidden ones', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [activeItem, hiddenItem] }) }));

    render(<CatalogModerationPage />);

    await waitFor(() => expect(screen.getByText(/Gen AI Fundamentals/)).toBeInTheDocument());
    expect(screen.getByText(/Old Webinar/)).toBeInTheDocument();
    expect(screen.getByText(/— hidden/)).toBeInTheDocument();
  });

  it('unhides a hidden item via the Unhide button', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [hiddenItem] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ item: { ...hiddenItem, active: true } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ ...hiddenItem, active: true }] }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<CatalogModerationPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Unhide' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Unhide' }));

    await waitFor(() => expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/catalog/2',
      expect.objectContaining({ method: 'PATCH' }),
    ));
  });

  it('shows the specific rejected field(s) when an edit is invalid', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [activeItem] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Invalid value for field(s): tier' }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<CatalogModerationPage />);
    await waitFor(() => expect(screen.getByText(/Gen AI Fundamentals/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Invalid value for field(s): tier')).toBeInTheDocument());
    // Still in edit mode — the Save button (not Edit) is still present, proving nothing silently closed/succeeded.
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('deletes an item after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [activeItem] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<CatalogModerationPage />);
    await waitFor(() => expect(screen.getByText(/Gen AI Fundamentals/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByText('No catalog items.')).toBeInTheDocument());
    confirmSpy.mockRestore();
  });
});
