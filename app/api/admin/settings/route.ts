import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { setSetting } from '@/lib/workbook/types';

export async function POST(request: NextRequest) {
  const { passcode, key, value } = await request.json();

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, passcode)) return { unauthorized: true } as const;
    setSetting(wb, key, value);
    return { unauthorized: false } as const;
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  return NextResponse.json({ ok: true });
}
