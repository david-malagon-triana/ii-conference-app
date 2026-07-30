import { describe, it, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { loadWorkbook, saveWorkbook, withWorkbook } from '../../lib/workbook/store';
import { emptyWorkbook } from '../../lib/workbook/types';

function tmpFile(): string {
  return path.join(os.tmpdir(), `wb-test-${Date.now()}-${Math.random()}.xlsx`);
}

let filesToClean: string[] = [];
afterEach(async () => {
  await Promise.all(filesToClean.map((f) => fs.rm(f, { force: true })));
  filesToClean = [];
});

describe('loadWorkbook', () => {
  it('returns an empty workbook when the file does not exist', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = await loadWorkbook(file);
    expect(wb).toEqual(emptyWorkbook());
  });

  it('round-trips a workbook through save then load', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    const wb = emptyWorkbook();
    wb.topics.push({ id: 't1', name: 'Data Strategy', category: 'Data Strategy', keywords: 'AI, governance' });
    wb.settings.push({ key: 'reminderLeadDays', value: '3' });
    await saveWorkbook(file, wb);
    const loaded = await loadWorkbook(file);
    expect(loaded.topics).toEqual(wb.topics);
    expect(loaded.settings).toEqual(wb.settings);
  });
});

describe('withWorkbook', () => {
  it('serializes concurrent mutations so no update is lost', async () => {
    const file = tmpFile();
    filesToClean.push(file);
    await saveWorkbook(file, emptyWorkbook());

    const bump = () =>
      withWorkbook(file, (wb) => {
        const existing = wb.settings.find((s) => s.key === 'counter');
        const next = existing ? String(Number(existing.value) + 1) : '1';
        if (existing) existing.value = next;
        else wb.settings.push({ key: 'counter', value: next });
      });

    await Promise.all([bump(), bump(), bump(), bump(), bump()]);

    const final = await loadWorkbook(file);
    expect(final.settings.find((s) => s.key === 'counter')?.value).toBe('5');
  });
});
