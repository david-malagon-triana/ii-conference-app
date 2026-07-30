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

  // Unlike the public /api/catalog, this returns every item regardless of `active`,
  // so the moderation page can list (and unhide) items that are currently hidden.
  return NextResponse.json({ items: wb.discoveredItems });
}
