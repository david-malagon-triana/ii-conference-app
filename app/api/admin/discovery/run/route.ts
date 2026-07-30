import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { runDailyDiscovery } from '@/lib/discovery/runDiscovery';
import { searchGoogle } from '@/lib/discovery/googleSearchProvider';

export async function POST(request: NextRequest) {
  const { passcode } = await request.json();

  const result = await withWorkbook(getWorkbookPath(), async (wb) => {
    if (!checkPasscode(wb, passcode)) return { unauthorized: true } as const;
    const apiKey = process.env.GOOGLE_CSE_API_KEY ?? '';
    const cseId = process.env.GOOGLE_CSE_ID ?? '';
    const { alerts } = await runDailyDiscovery(wb, (topic) => searchGoogle(topic, { apiKey, cseId }), new Date());
    return { unauthorized: false, alerts } as const;
  });

  if (result.unauthorized) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }
  return NextResponse.json({ alerts: result.alerts });
}
