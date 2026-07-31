import { NextRequest, NextResponse } from 'next/server';
import { loadWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { runDiscoveryAndAlert } from '@/lib/discovery/discoveryJob';

const HISTORY_LIMIT = 50;

/** SearchRun history, newest first and capped to the most recent HISTORY_LIMIT, for the admin discovery-control screen. */
export async function GET(request: NextRequest) {
  const passcode = request.nextUrl.searchParams.get('passcode') ?? '';
  const wb = await loadWorkbook(getWorkbookPath());

  if (!checkPasscode(wb, passcode)) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const sorted = [...wb.searchRuns].sort((a, b) => b.ranAt.localeCompare(a.ranAt));
  const runs = sorted.slice(0, HISTORY_LIMIT);
  const truncated = sorted.length > HISTORY_LIMIT;
  const topicNames = Object.fromEntries(wb.topics.map((t) => [t.id, t.name]));

  return NextResponse.json({ runs, topicNames, truncated });
}

export async function POST(request: NextRequest) {
  const { passcode } = await request.json();

  // Passcode check is a plain read — deliberately not wrapped in `withWorkbook`, so the
  // subsequent network I/O in `runDiscoveryAndAlert` never happens under the write lock.
  const wb = await loadWorkbook(getWorkbookPath());
  if (!checkPasscode(wb, passcode)) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const { alerts, alertEmailConfigured } = await runDiscoveryAndAlert();

  return NextResponse.json({ alerts, alertEmailConfigured });
}
