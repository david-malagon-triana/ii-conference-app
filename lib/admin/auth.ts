import { Workbook, getSetting } from '../workbook/types';

export function checkPasscode(wb: Workbook, provided: string): boolean {
  const actual = getSetting(wb, 'adminPasscode');
  return Boolean(actual) && provided === actual;
}
