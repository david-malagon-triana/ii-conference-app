import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, body.passcode)) return { unauthorized: true } as const;
    const item = wb.discoveredItems.find((i) => i.id === id);
    if (!item) return { unauthorized: false, notFound: true } as const;
    Object.assign(item, body.updates);
    return { unauthorized: false, notFound: false, item } as const;
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  if (result.notFound) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ item: result.item });
}
