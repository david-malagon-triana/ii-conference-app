// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkInterestModal } from '../../components/MarkInterestModal';
import { DiscoveredItemRow } from '../../lib/workbook/types';

function item(overrides: Partial<DiscoveredItemRow> = {}): DiscoveredItemRow {
  return {
    id: '1', title: 'Gen AI Summit', type: 'SEMINAR', provider: '', url: '', description: '',
    format: 'PHYSICAL', location: 'Oslo', startDate: '2026-10-01', endDate: null, duration: '1 day',
    priceStatus: 'FREE', tier: 'BASICS', tierRationale: '', relevanceScore: 0, speakersCompanies: '',
    active: true, discoveredAt: '', sourceQuery: '', topicIds: 't1',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MarkInterestModal — free item', () => {
  it('shows only name/email fields, submits successfully, and stays dismissible', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<MarkInterestModal item={item({ priceStatus: 'FREE' })} onClose={onClose} />);

    expect(screen.queryByText("Your PM's name")).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'jane@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getByText(/Noted/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/interest',
      expect.objectContaining({
        body: JSON.stringify({ itemId: '1', employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com' }),
      }),
    );

    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('MarkInterestModal — paid item', () => {
  it('shows PM fields and requires them before submitting', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<MarkInterestModal item={item({ priceStatus: 'PAID' })} onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'jane@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Notify PM' }));

    expect(screen.getByText("Your PM's name and email are required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits successfully once PM fields are filled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<MarkInterestModal item={item({ priceStatus: 'PAID' })} onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'jane@capgemini.com');
    await user.type(screen.getByPlaceholderText('John Smith'), 'John Smith');
    await user.type(screen.getByPlaceholderText('pm@capgemini.com'), 'john@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Notify PM' }));

    await waitFor(() => expect(screen.getByText(/PM has been notified/)).toBeInTheDocument());
  });
});

describe('MarkInterestModal — error paths', () => {
  it('shows the server-provided error message on a non-OK response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Item not found' }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<MarkInterestModal item={item({ priceStatus: 'FREE' })} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'jane@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getByText('Item not found')).toBeInTheDocument());
  });

  it('shows a network-failure message and recovers from the "sending" state', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<MarkInterestModal item={item({ priceStatus: 'FREE' })} onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('name@capgemini.com'), 'jane@capgemini.com');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getByText("Couldn't reach the server. Try again.")).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
  });

  it('is dismissible from every state via the close button', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<MarkInterestModal item={item({ priceStatus: 'FREE' })} onClose={onClose} />);
    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
