// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, FilterValues } from '../../components/FilterBar';

const defaultValues: FilterValues = { search: '', topicId: '', tier: '', format: '', type: '', dateRange: '' };
const topics = [{ id: 't1', name: 'Data Strategy' }, { id: 't2', name: 'Smart Assets' }];

describe('FilterBar', () => {
  it('renders all six filter controls', () => {
    render(<FilterBar topics={topics} values={defaultValues} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByText('Topic: All')).toBeInTheDocument();
    expect(screen.getByText('Tier: All')).toBeInTheDocument();
    expect(screen.getByText('Format: All')).toBeInTheDocument();
    expect(screen.getByText('Type: All')).toBeInTheDocument();
    expect(screen.getByText('Any date')).toBeInTheDocument();
  });

  it('lists the given topics in the topic select', () => {
    render(<FilterBar topics={topics} values={defaultValues} onChange={vi.fn()} />);
    expect(screen.getByText('Data Strategy')).toBeInTheDocument();
    expect(screen.getByText('Smart Assets')).toBeInTheDocument();
  });

  it('calls onChange with the updated search value on typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar topics={topics} values={defaultValues} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('Search'), 'x');
    expect(onChange).toHaveBeenCalledWith({ ...defaultValues, search: 'x' });
  });

  it('calls onChange with the updated date range on selection', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar topics={topics} values={defaultValues} onChange={onChange} />);
    await user.selectOptions(screen.getByText('Any date').closest('select')!, '30');
    expect(onChange).toHaveBeenCalledWith({ ...defaultValues, dateRange: '30' });
  });
});
