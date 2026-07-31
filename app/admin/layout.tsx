'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  function enter() {
    (window as any).__ADMIN_PASSCODE__ = passcode;
    setUnlocked(true);
  }

  if (!unlocked) {
    return (
      <div className="max-w-xs mx-auto mt-10">
        <p className="font-serif text-lg mb-2">Admin passcode</p>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') enter();
          }}
          className="w-full border border-slate-700 bg-transparent rounded px-2 py-1 text-sm mb-2"
        />
        <button
          onClick={enter}
          className="w-full rounded py-1.5 text-sm text-invent-grey1 bg-gradient-to-r from-invent-blue to-invent-light-blue transition-all duration-150 hover:brightness-125 hover:saturate-150 hover:scale-[1.02]"
        >
          Enter
        </button>
        <p className="text-xs text-invent-grey4 mt-2">
          Each admin action below sends this passcode with the request; a wrong passcode is rejected per-action.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs mb-4">
        <Link href="/admin" className="text-invent-grey4">
          &larr; Admin home
        </Link>
      </p>
      {children}
    </div>
  );
}
