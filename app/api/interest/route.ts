import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { markInterest } from '@/lib/interest/markInterest';

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const created = await withWorkbook(getWorkbookPath(), (wb) => markInterest(wb, body, new Date()));
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
