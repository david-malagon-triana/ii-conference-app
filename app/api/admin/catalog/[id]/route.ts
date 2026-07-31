import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { applyCatalogUpdates } from '@/lib/admin/catalogUpdates';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, body.passcode ?? '')) {
      return { unauthorized: true, notFound: false, rejected: [] as string[], item: null };
    }
    const item = wb.discoveredItems.find((i) => i.id === id);
    if (!item) {
      return { unauthorized: false, notFound: true, rejected: [] as string[], item: null };
    }
    // Whitelisted, all-or-nothing field application — never a bulk Object.assign of the request body.
    const { rejected } = applyCatalogUpdates(item, body.updates);
    return { unauthorized: false, notFound: false, rejected, item: rejected.length === 0 ? item : null };
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  if (result.notFound) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  if (result.rejected.length > 0) {
    return NextResponse.json(
      { error: `Invalid value for field(s): ${result.rejected.join(', ')}` },
      { status: 400 },
    );
  }
  return NextResponse.json({ item: result.item });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: { passcode?: string } = await request.json().catch(() => ({}));

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, body.passcode ?? '')) return { unauthorized: true } as const;
    const index = wb.discoveredItems.findIndex((i) => i.id === id);
    if (index === -1) return { unauthorized: false, notFound: true } as const;
    wb.discoveredItems.splice(index, 1);
    return { unauthorized: false, notFound: false } as const;
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  if (result.notFound) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
