import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withWorkbook, loadWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';

export async function GET() {
  const wb = await loadWorkbook(getWorkbookPath());
  return NextResponse.json({ topics: wb.topics });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!(await withWorkbook(getWorkbookPath(), (wb) => checkPasscode(wb, body.passcode)))) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const topic = await withWorkbook(getWorkbookPath(), (wb) => {
    const newTopic = { id: randomUUID(), name: body.name, category: body.category, keywords: body.keywords };
    wb.topics.push(newTopic);
    return newTopic;
  });

  return NextResponse.json({ topic }, { status: 201 });
}
