import Link from 'next/link';
import { INVENT_LOGO_SVG_PATH } from '@/lib/logo';

export function Header() {
  return (
    <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-5">
      <div className="flex items-center gap-3">
        <svg width="22" height="22" viewBox="0 0 163 163" fill="none" aria-hidden="true">
          <path d={INVENT_LOGO_SVG_PATH} fill="#F3F4F7" />
        </svg>
        <span className="text-base font-light">Capgemini Invent &middot; II Conference &amp; Learning Discovery</span>
      </div>
      <nav className="flex gap-5 text-sm">
        <Link href="/" className="text-invent-grey1 border-b-2 border-invent-blue pb-1">Home</Link>
        <Link href="/catalog" className="text-invent-grey4">Catalog</Link>
        <Link href="/my-requests" className="text-invent-grey4">My requests</Link>
      </nav>
    </div>
  );
}
