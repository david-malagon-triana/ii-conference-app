// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopicsPage from '../../../../app/admin/topics/page';

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as any).__ADMIN_PASSCODE__;
});

const topic = { id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI' };

describe('TopicsPage', () => {
  it('lists topics loaded on mount', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ topics: [topic] }) }));

    render(<TopicsPage />);

    await waitFor(() => expect(screen.getByText('Data Strategy')).toBeInTheDocument());
  });

  it('adds a topic via POST and reloads the list', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [] }) }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topic }) }) // POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [topic] }) }); // reload
    vi.stubGlobal('fetch', fetchMock);
    (window as any).__ADMIN_PASSCODE__ = 'changeme';
    const user = userEvent.setup();

    render(<TopicsPage />);
    await user.type(screen.getByPlaceholderText('Name'), 'Data Strategy');
    await user.type(screen.getByPlaceholderText('Category'), 'Data Strategy');
    await user.type(screen.getByPlaceholderText('Keywords, comma-separated'), 'Gen AI');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(screen.getByText('Data Strategy')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/topics',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ passcode: 'changeme', name: 'Data Strategy', category: 'Data Strategy', keywords: 'Gen AI' }),
      }),
    );
  });

  it('shows the specific rejected field(s) when an edit is invalid, and does not close the edit form', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [topic] }) }) // initial load
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Invalid value for field(s): name' }) }); // PATCH
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<TopicsPage />);
    await waitFor(() => expect(screen.getByText('Data Strategy')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Invalid value for field(s): name')).toBeInTheDocument());
    // Still in edit mode — the Save button (not Edit) is still present, proving nothing silently closed/succeeded.
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('removes a topic after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [topic] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<TopicsPage />);
    await waitFor(() => expect(screen.getByText('Data Strategy')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(screen.getByText('No topics yet.')).toBeInTheDocument());
    confirmSpy.mockRestore();
  });

  it('sends a DELETE request to the topic-specific endpoint when removing', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [topic] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<TopicsPage />);
    await waitFor(() => expect(screen.getByText('Data Strategy')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/topics/t1',
      expect.objectContaining({ method: 'DELETE' }),
    ));
    confirmSpy.mockRestore();
  });

  it('saves an edited topic with the correct PATCH payload and closes the edit form on success', async () => {
    const updated = { ...topic, name: 'AI Strategy', category: 'AI', keywords: 'Gen AI, LLM' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [topic] }) }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topic: updated }) }) // PATCH
      .mockResolvedValueOnce({ ok: true, json: async () => ({ topics: [updated] }) }); // reload
    vi.stubGlobal('fetch', fetchMock);
    (window as any).__ADMIN_PASSCODE__ = 'changeme';
    const user = userEvent.setup();

    render(<TopicsPage />);
    await waitFor(() => expect(screen.getByText('Data Strategy')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const nameInputs = screen.getAllByPlaceholderText('Name');
    const editNameInput = nameInputs[nameInputs.length - 1];
    await user.clear(editNameInput);
    await user.type(editNameInput, 'AI Strategy');

    const categoryInputs = screen.getAllByPlaceholderText('Category');
    const editCategoryInput = categoryInputs[categoryInputs.length - 1];
    await user.clear(editCategoryInput);
    await user.type(editCategoryInput, 'AI');

    const keywordsInputs = screen.getAllByPlaceholderText('Keywords, comma-separated');
    const editKeywordsInput = keywordsInputs[keywordsInputs.length - 1];
    await user.clear(editKeywordsInput);
    await user.type(editKeywordsInput, 'Gen AI, LLM');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin/topics/t1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          passcode: 'changeme',
          updates: { name: 'AI Strategy', category: 'AI', keywords: 'Gen AI, LLM' },
        }),
      }),
    ));
    // Edit form closed on success — the Save button is no longer present.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument());
  });
});
