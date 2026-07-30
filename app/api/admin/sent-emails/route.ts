import { NextRequest, NextResponse } from 'next/server';
import { loadWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  const passcode = request.nextUrl.searchParams.get('passcode') ?? '';
  const wb = await loadWorkbook(getWorkbookPath());

  if (!checkPasscode(wb, passcode)) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  return NextResponse.json({ emails: wb.sentEmails });
}
