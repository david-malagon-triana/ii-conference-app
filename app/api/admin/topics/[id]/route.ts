import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';
import { applyTopicUpdates } from '@/lib/admin/topicUpdates';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, body.passcode ?? '')) {
      return { unauthorized: true, notFound: false, rejected: [] as string[], topic: null };
    }
    const topic = wb.topics.find((t) => t.id === id);
    if (!topic) {
      return { unauthorized: false, notFound: true, rejected: [] as string[], topic: null };
    }
    const { rejected } = applyTopicUpdates(topic, body.updates);
    return { unauthorized: false, notFound: false, rejected, topic: rejected.length === 0 ? topic : null };
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  if (result.notFound) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  if (result.rejected.length > 0) {
    return NextResponse.json(
      { error: `Invalid value for field(s): ${result.rejected.join(', ')}` },
      { status: 400 },
    );
  }
  return NextResponse.json({ topic: result.topic });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: { passcode?: string } = await request.json().catch(() => ({}));

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, body.passcode ?? '')) return { unauthorized: true } as const;
    const index = wb.topics.findIndex((t) => t.id === id);
    if (index === -1) return { unauthorized: false, notFound: true } as const;
    wb.topics.splice(index, 1);
    // Discovered items keep their historical topicIds reference; with the topic gone they simply
    // stop appearing under it on Home and in the topic filter, which is the intended outcome.
    return { unauthorized: false, notFound: false } as const;
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  if (result.notFound) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
