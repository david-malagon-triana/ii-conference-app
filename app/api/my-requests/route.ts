import { NextRequest, NextResponse } from 'next/server';
import { loadWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
  }

  const wb = await loadWorkbook(getWorkbookPath());
  const requests = wb.interestRequests.filter((r) => r.employeeEmail.toLowerCase() === email.toLowerCase());
  const items = requests.map((r) => ({
    request: r,
    item: wb.discoveredItems.find((i) => i.id === r.itemId) ?? null,
  }));

  return NextResponse.json({ items });
}
