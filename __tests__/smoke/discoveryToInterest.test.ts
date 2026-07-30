import { describe, it, expect } from 'vitest';
import { emptyWorkbook } from '../../lib/workbook/types';
import { seedTopics, defaultSettings } from '../../lib/workbook/seed';
import { runDailyDiscovery } from '../../lib/discovery/runDiscovery';
import { topPicksByTopic } from '../../lib/ranking';
import { queryCatalog } from '../../lib/catalogQuery';
import { markInterest } from '../../lib/interest/markInterest';
import { findDueReminders, sendDueReminders } from '../../lib/interest/reminders';

describe('end-to-end: discovery -> home ranking -> catalog -> mark interest -> reminder', () => {
  it('runs the full chain against the mock-style fake search function', async () => {
    const wb = emptyWorkbook();
    wb.topics = seedTopics();
    wb.settings = defaultSettings();

    const now = new Date('2026-08-01T00:00:00.000Z');
    const fakeSearchFn = async (topic: (typeof wb.topics)[number]) => [
      {
        title: `${topic.name} fundamentals webinar`,
        url: `https://example.com/${topic.id}/1`,
        snippet: 'Free, introduction to the fundamentals, 3 August 2026',
      },
      {
        title: `${topic.name} advanced masterclass`,
        url: `https://example.com/${topic.id}/2`,
        snippet: 'Fee: 500 EUR, 10 September 2026',
      },
    ];

    const { alerts } = await runDailyDiscovery(wb, fakeSearchFn, now);
    expect(alerts).toHaveLength(0);
    expect(wb.discoveredItems.length).toBe(wb.topics.length * 2);

    const picks = topPicksByTopic(wb.discoveredItems, wb.topics, 3);
    expect(picks.length).toBe(wb.topics.length);

    const catalogResults = queryCatalog(wb.discoveredItems, { tier: 'FUNDAMENTALS' });
    expect(catalogResults.length).toBe(wb.topics.length);

    const freeItem = wb.discoveredItems.find((i) => i.priceStatus === 'FREE')!;
    const request = markInterest(
      wb,
      { itemId: freeItem.id, employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com' },
      now,
    );
    expect(request.pmNotified).toBe(false);

    const paidItem = wb.discoveredItems.find((i) => i.priceStatus === 'PAID')!;
    // Set the paid item's date just outside today's reminder window so we can move `now` forward and see it become due.
    paidItem.startDate = '2026-08-03';
    markInterest(
      wb,
      {
        itemId: paidItem.id, employeeName: 'Jane Doe', employeeEmail: 'jane@capgemini.com',
        pmName: 'John Smith', pmEmail: 'john@capgemini.com',
      },
      now,
    );
    expect(wb.sentEmails.filter((e) => e.kind === 'PM_NOTIFICATION')).toHaveLength(1);

    const laterNow = new Date('2026-08-01T12:00:00.000Z');
    const due = findDueReminders(wb, laterNow);
    expect(due.some((d) => d.item.id === paidItem.id)).toBe(true);

    const sentCount = sendDueReminders(wb, laterNow);
    expect(sentCount).toBeGreaterThanOrEqual(1);
    expect(wb.sentEmails.some((e) => e.kind === 'REMINDER')).toBe(true);
  });
});
