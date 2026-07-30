import { NextRequest, NextResponse } from 'next/server';
import { loadWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { queryCatalog } from '@/lib/catalogQuery';

export async function GET(request: NextRequest) {
  const wb = await loadWorkbook(getWorkbookPath());
  const params = request.nextUrl.searchParams;

  const items = queryCatalog(wb.discoveredItems, {
    search: params.get('search') ?? undefined,
    topicId: params.get('topicId') ?? undefined,
    tier: (params.get('tier') as any) ?? undefined,
    format: (params.get('format') as any) ?? undefined,
    type: (params.get('type') as any) ?? undefined,
    dateFrom: params.get('dateFrom') ? new Date(params.get('dateFrom')!) : undefined,
    dateTo: params.get('dateTo') ? new Date(params.get('dateTo')!) : undefined,
  });

  return NextResponse.json({ items, topics: wb.topics });
}
