// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminHome from '../../../app/admin/page';

describe('AdminHome', () => {
  it('links to all six admin sections', () => {
    render(<AdminHome />);
    expect(screen.getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/admin/topics');
    expect(screen.getByRole('link', { name: 'Discovery control' })).toHaveAttribute('href', '/admin/discovery');
    expect(screen.getByRole('link', { name: 'Catalog moderation' })).toHaveAttribute('href', '/admin/catalog');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/admin/settings');
    expect(screen.getByRole('link', { name: 'Reporting' })).toHaveAttribute('href', '/admin/reporting');
    expect(screen.getByRole('link', { name: 'Sent emails log' })).toHaveAttribute('href', '/admin/sent-emails');
  });
});
