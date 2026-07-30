import { describe, it, expect } from 'vitest';
import { checkPasscode } from '../../lib/admin/auth';
import { emptyWorkbook } from '../../lib/workbook/types';

describe('checkPasscode', () => {
  it('returns true when the provided passcode matches Settings.adminPasscode', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'adminPasscode', value: 'secret123' }];
    expect(checkPasscode(wb, 'secret123')).toBe(true);
  });

  it('returns false on a mismatch', () => {
    const wb = emptyWorkbook();
    wb.settings = [{ key: 'adminPasscode', value: 'secret123' }];
    expect(checkPasscode(wb, 'wrong')).toBe(false);
  });

  it('returns false when no passcode setting exists', () => {
    const wb = emptyWorkbook();
    expect(checkPasscode(wb, 'anything')).toBe(false);
  });
});
