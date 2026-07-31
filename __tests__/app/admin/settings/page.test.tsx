// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../../../../app/admin/settings/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SettingsPage', () => {
  it('saves reminderLeadDays and shows a confirmation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    const [reminderInput] = screen.getAllByRole('textbox');
    await user.clear(reminderInput);
    await user.type(reminderInput, '5');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() => expect(screen.getByText('Saved reminderLeadDays')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/settings',
      expect.objectContaining({
        body: expect.stringContaining('"key":"reminderLeadDays"'),
      }),
    );
  });

  it('shows an error message on a wrong-passcode response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Invalid passcode' }) }));
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() => expect(screen.getByText('Invalid passcode')).toBeInTheDocument());
  });

  it('saves systemAlertEmail and shows a confirmation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    const [, systemAlertEmailInput] = screen.getAllByRole('textbox');
    await user.type(systemAlertEmailInput, 'lead@capgemini.com');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);

    await waitFor(() => expect(screen.getByText('Saved systemAlertEmail')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/settings',
      expect.objectContaining({
        body: JSON.stringify({ passcode: undefined, key: 'systemAlertEmail', value: 'lead@capgemini.com' }),
      }),
    );
  });

  it('saves adminPasscode and shows a confirmation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    const [, , adminPasscodeInput] = screen.getAllByRole('textbox');
    await user.type(adminPasscodeInput, 'newpasscode');
    await user.click(screen.getAllByRole('button', { name: 'Save' })[2]);

    await waitFor(() => expect(screen.getByText('Saved adminPasscode')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/settings',
      expect.objectContaining({
        body: JSON.stringify({ passcode: undefined, key: 'adminPasscode', value: 'newpasscode' }),
      }),
    );
  });
});
