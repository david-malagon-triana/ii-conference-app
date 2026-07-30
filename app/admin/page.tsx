import Link from 'next/link';

export default function AdminHome() {
  const links = [
    { href: '/admin/topics', label: 'Topics' },
    { href: '/admin/discovery', label: 'Discovery control' },
    { href: '/admin/catalog', label: 'Catalog moderation' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/reporting', label: 'Reporting' },
    { href: '/admin/sent-emails', label: 'Sent emails log' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="border border-slate-700 rounded-lg p-4 text-sm">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
