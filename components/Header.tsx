'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { INVENT_LOGO_SVG_PATH } from '@/lib/logo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/my-requests', label: 'My requests' },
];

const ACTIVE_CLASS = 'text-invent-grey1 border-b-2 border-invent-blue pb-1 transition-colors duration-200';
const INACTIVE_CLASS =
  'text-invent-grey4 border-b-2 border-transparent pb-1 transition-colors duration-200 hover:text-invent-grey1 hover:border-invent-light-blue';

export function Header() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-5">
      <div className="flex items-center gap-3">
        <svg width="22" height="22" viewBox="0 0 163 163" fill="none" aria-hidden="true">
          <path d={INVENT_LOGO_SVG_PATH} fill="#F3F4F7" />
        </svg>
        <span className="text-base font-light">Capgemini Invent &middot; II Conference &amp; Learning Discovery</span>
      </div>
      <nav className="flex gap-5 text-sm">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? ACTIVE_CLASS : INACTIVE_CLASS}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
