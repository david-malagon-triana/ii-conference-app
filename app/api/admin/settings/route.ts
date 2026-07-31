import { NextRequest, NextResponse } from 'next/server';
import { loadWorkbook, withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { setSetting } from '@/lib/workbook/types';

/** Settings never returned to the client, even behind the passcode gate. */
const SECRET_SETTINGS = new Set(['adminPasscode']);

export async function GET(request: NextRequest) {
  const passcode = request.nextUrl.searchParams.get('passcode') ?? '';
  const wb = await loadWorkbook(getWorkbookPath());

  if (!checkPasscode(wb, passcode)) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const settings = Object.fromEntries(
    wb.settings.filter((s) => !SECRET_SETTINGS.has(s.key)).map((s) => [s.key, s.value]),
  );

  return NextResponse.json({ settings });
}

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
