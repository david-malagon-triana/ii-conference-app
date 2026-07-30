import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { sendDueReminders } from '@/lib/interest/reminders';

export async function POST(request: NextRequest) {
  const { passcode } = await request.json();

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, passcode)) return { unauthorized: true } as const;
    const count = sendDueReminders(wb, new Date());
    return { unauthorized: false, count } as const;
  });

  if (result.unauthorized) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }
  return NextResponse.json({ remindersSent: result.count });
}
