import { NextRequest, NextResponse } from 'next/server';
import { withWorkbook } from '@/lib/workbook/store';
import { getWorkbookPath } from '@/lib/workbookPath';
import { checkPasscode } from '@/lib/admin/auth';

/** Only these topic fields are editable; `id` is never reassignable. */
const EDITABLE_TOPIC_FIELDS = ['name', 'category', 'keywords'] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const result = await withWorkbook(getWorkbookPath(), (wb) => {
    if (!checkPasscode(wb, body.passcode ?? '')) return { unauthorized: true } as const;
    const topic = wb.topics.find((t) => t.id === id);
    if (!topic) return { unauthorized: false, notFound: true } as const;

    const updates = (body.updates ?? {}) as Record<string, unknown>;
    for (const field of EDITABLE_TOPIC_FIELDS) {
      const value = updates[field];
      if (typeof value === 'string') topic[field] = value;
    }

    return { unauthorized: false, notFound: false, topic } as const;
  });

  if (result.unauthorized) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  if (result.notFound) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
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
