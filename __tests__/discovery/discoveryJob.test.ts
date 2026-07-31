import { describe, it, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { loadWorkbook, saveWorkbook, withWorkbook } from '../../lib/workbook/store';
import { emptyWorkbook, getSetting, TopicRow } from '../../lib/workbook/types';
import { seedTopics, defaultSettings } from '../../lib/workbook/seed';
import { LAST_RUN_SETTING, runDiscoveryAndAlert } from '../../lib/discovery/discoveryJob';

function tmpFile(): string {
  return path.join(os.tmpdir(), `job-test-${Date.now()}-${Math.random()}.xlsx`);
}

let filesToClean: string[] = [];
afterEach(async () => {
  await Promise.all(filesToClean.map((f) => fs.rm(f, { force: true })));
  filesToClean = [];
});

async function seededFile(overrides: (wb: ReturnType<typeof emptyWorkbook>) => void = () => {}): Promise<string> {
  const file = tmpFile();
  filesToClean.push(file);
  const wb = emptyWorkbook();
  wb.topics = seedTopics().slice(0, 2);
  wb.settings = defaultSettings();
  overrides(wb);
  await saveWorkbook(file, wb);
  return file;
}

describe('runDiscoveryAndAlert', () => {
  it('appends discovered items, logs runs, and persists lastDiscoveryRunAt', async () => {
    const file = await seededFile();
    const now = new Date('2026-08-01T06:05:00.000Z');

    const { alerts, alertEmailConfigured } = await runDiscoveryAndAlert(
      now,
      async (t: TopicRow) => [{ title: `${t.name} intro`, url: `https://example.com/${t.id}`, snippet: 'Free intro' }],
      file,
    );

    expect(alerts).toHaveLength(0);
    expect(alertEmailConfigured).toBe(false);

    const wb = await loadWorkbook(file);
    expect(wb.discoveredItems).toHaveLength(2);
    expect(wb.searchRuns).toHaveLength(2);
    expect(getSetting(wb, LAST_RUN_SETTING)).toBe(now.toISOString());
  });

  it('sends one SYSTEM_ALERT email per failed topic when an alert address is configured', async () => {
    const file = await seededFile((wb) => {
      wb.settings = wb.settings.map((s) =>
        s.key === 'systemAlertEmail' ? { key: s.key, value: 'cd-lead@capgemini.com' } : s,
      );
    });

    const { alerts, alertEmailConfigured } = await runDiscoveryAndAlert(
      new Date('2026-08-01T06:05:00.000Z'),
      async () => {
        throw new Error('The operation was aborted due to timeout');
      },
      file,
    );

    expect(alerts).toHaveLength(2);
    expect(alertEmailConfigured).toBe(true);

    const wb = await loadWorkbook(file);
    const alertEmails = wb.sentEmails.filter((e) => e.kind === 'SYSTEM_ALERT');
    expect(alertEmails).toHaveLength(2);
    expect(alertEmails[0].to).toBe('cd-lead@capgemini.com');
    expect(alertEmails[0].body).toContain('aborted due to timeout');
    expect(wb.searchRuns.every((r) => r.status === 'FAILED')).toBe(true);
  });

  it('reports alertEmailConfigured=false (and sends nothing) when no alert address is set', async () => {
    const file = await seededFile();

    const { alerts, alertEmailConfigured } = await runDiscoveryAndAlert(
      new Date('2026-08-01T06:05:00.000Z'),
      async () => {
        throw new Error('API down');
      },
      file,
    );

    expect(alerts).toHaveLength(2);
    expect(alertEmailConfigured).toBe(false);
    const wb = await loadWorkbook(file);
    expect(wb.sentEmails).toHaveLength(0);
  });

  it('does not hold the workbook write lock while searches are in flight', async () => {
    const file = await seededFile();

    let releaseSearch!: () => void;
    const searchGate = new Promise<void>((resolve) => {
      releaseSearch = resolve;
    });
    let notifyStarted!: () => void;
    const searchStarted = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    let started = false;

    // Simulates the hung corporate-network request from Critical finding 1.
    const hangingSearch = async (t: TopicRow) => {
      if (!started) {
        started = true;
        notifyStarted();
      }
      await searchGate;
      return [{ title: `${t.name} intro`, url: `https://example.com/${t.id}`, snippet: 'Free intro' }];
    };

    const jobPromise = runDiscoveryAndAlert(new Date('2026-08-01T06:05:00.000Z'), hangingSearch, file);
    await searchStarted;

    // While discovery is stuck mid-search, an unrelated write must still complete promptly.
    // Before the fix this blocked until the search resolved — i.e. forever.
    const otherWrite = withWorkbook(file, (wb) => {
      wb.settings.push({ key: 'unrelatedWrite', value: 'ok' });
      return 'written';
    });
    const raced = await Promise.race([
      otherWrite,
      new Promise((resolve) => setTimeout(() => resolve('TIMED_OUT'), 2000)),
    ]);
    expect(raced).toBe('written');

    releaseSearch();
    await jobPromise;

    const wb = await loadWorkbook(file);
    expect(getSetting(wb, 'unrelatedWrite')).toBe('ok');
    expect(wb.discoveredItems).toHaveLength(2);
  }, 15_000);
});
