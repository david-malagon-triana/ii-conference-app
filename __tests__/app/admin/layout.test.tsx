// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from '../../../app/admin/layout';

describe('AdminLayout (passcode gate)', () => {
  it('blocks children until a passcode is entered, then unlocks', async () => {
    const user = userEvent.setup();
    render(
      <AdminLayout>
        <p>Protected content</p>
      </AdminLayout>,
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Admin passcode')).toBeInTheDocument();

    // The passcode input has type="password" with no accessible name distinguishing it,
    // so it's queried directly rather than by role/label.
    const passcodeInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await user.type(passcodeInput, 'changeme');
    await user.click(screen.getByRole('button', { name: 'Enter' }));

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect((window as any).__ADMIN_PASSCODE__).toBe('changeme');
  });
});
