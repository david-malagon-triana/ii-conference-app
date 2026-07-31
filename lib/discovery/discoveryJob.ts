import { loadWorkbook, withWorkbook } from '../workbook/store';
import { getWorkbookPath } from '../workbookPath';
import { TopicRow, getSetting, setSetting } from '../workbook/types';
import { sendSimulatedEmail } from '../email/sendEmail';
import { buildSystemAlertEmail } from '../email/templates';
import { applyDiscoveryResults, fetchDiscoveryCandidates } from './runDiscovery';
import { SearchProvider, getSearchProvider } from './searchProvider';

/** Settings key holding the last completed discovery run, so the schedule survives a restart. */
export const LAST_RUN_SETTING = 'lastDiscoveryRunAt';

export interface DiscoveryJobResult {
  alerts: { topic: TopicRow; error: string }[];
  /** False when failures happened but no `systemAlertEmail` is configured to receive them. */
  alertEmailConfigured: boolean;
}

/**
 * The single entry point for "run discovery and alert on failure", shared by the manual admin
 * route and the in-process scheduler so alert-email behaviour cannot drift between the two.
 *
 * Structured deliberately in three phases:
 *   1. read the topic list (no lock held)
 *   2. run every search (network I/O, no lock held)
 *   3. one short `withWorkbook` call to classify/dedupe/append and log alerts
 *
 * Phase 2 must never move inside phase 3: `withWorkbook`'s lock is a single process-wide promise
 * chain, so a hung HTTP request would otherwise block every other write in the app.
 */
export async function runDiscoveryAndAlert(
  now: Date = new Date(),
  searchFn: SearchProvider = getSearchProvider(),
  filePath: string = getWorkbookPath(),
): Promise<DiscoveryJobResult> {
  const { topics } = await loadWorkbook(filePath);
  const outcomes = await fetchDiscoveryCandidates(topics, searchFn);

  return withWorkbook(filePath, (wb) => {
    const { alerts } = applyDiscoveryResults(wb, outcomes, now);

    const alertEmail = getSetting(wb, 'systemAlertEmail');
    if (alertEmail) {
      for (const { topic, error } of alerts) {
        const email = buildSystemAlertEmail(topic, error);
        sendSimulatedEmail(wb, alertEmail, email.subject, email.body, 'SYSTEM_ALERT', now);
      }
    } else if (alerts.length > 0) {
      console.warn(
        `Discovery run had ${alerts.length} failed topic(s) but no systemAlertEmail is configured — ` +
          'see Admin > Discovery control for the SearchRun history.',
      );
    }

    // Persisted rather than kept in a module variable, so a dev-server restart can't re-trigger
    // the same day's run and burn through the free Custom Search quota.
    setSetting(wb, LAST_RUN_SETTING, now.toISOString());

    return { alerts, alertEmailConfigured: Boolean(alertEmail) };
  });
}
