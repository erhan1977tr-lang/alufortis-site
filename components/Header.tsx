'use client';
import { useState } from 'react';
import { languages, nav } from '@/lib/content';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wide font-[720] tracking-[-0.02em] ${className}`}>
      ALUFORTIS
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-night/75 text-paper backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <a href="#top" className="text-[19px]" aria-label="Alufortis ana sayfa">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-8 text-[15px] md:flex" aria-label="Ana menü">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="text-paper/75 transition-colors hover:text-paper">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <ul className="flex gap-2 text-[13px] text-paper/50" aria-label="Dil seçimi">
            {languages.map((l) => (
              <li key={l}>
                <span className={l === 'TR' ? 'font-semibold text-paper' : ''} aria-current={l === 'TR' ? 'true' : undefined}>
                  {l}
                </span>
              </li>
            ))}
          </ul>
          <a
            href="#iletisim"
            className="rounded-full bg-paper px-4 py-2 text-[14px] font-medium text-night transition-colors hover:bg-[#f0b27a]"
          >
            Teklif isteyin
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-expanded={open}
          aria-controls="mobil-menu"
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 block h-[2px] w-6 bg-paper transition-transform ${open ? 'top-[5px] rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 block h-[2px] w-6 bg-paper transition-transform ${open ? 'top-[5px] -rotate-45' : 'top-[10px]'}`} />
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobil-menu" className="border-t border-white/10 bg-night px-4 pb-6 md:hidden" aria-label="Mobil menü">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="semiwide block border-b border-white/10 py-4 text-2xl font-semibold"
            >
              {n.label}
            </a>
          ))}
          <p className="mt-5 flex gap-3 text-sm text-paper/50">
            {languages.map((l) => (
              <span key={l} className={l === 'TR' ? 'font-semibold text-paper' : ''}>
                {l}
              </span>
            ))}
          </p>
        </nav>
      )}
    </header>
  );
}
