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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <a href="#top" className="text-[19px]" aria-label="Alufortis ana sayfa">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-8 text-[15px] md:flex" aria-label="Ana menü">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="text-ink/80 transition-colors hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <ul className="flex gap-2 text-[13px] text-steel" aria-label="Dil seçimi">
            {languages.map((l) => (
              <li key={l}>
                <span className={l === 'TR' ? 'font-semibold text-ink' : ''} aria-current={l === 'TR' ? 'true' : undefined}>
                  {l}
                </span>
              </li>
            ))}
          </ul>
          <a
            href="#iletisim"
            className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-bronze"
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
            <span className={`absolute left-0 block h-[2px] w-6 bg-ink transition-transform ${open ? 'top-[5px] rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 block h-[2px] w-6 bg-ink transition-transform ${open ? 'top-[5px] -rotate-45' : 'top-[10px]'}`} />
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobil-menu" className="border-t border-ink/10 bg-paper px-4 pb-6 md:hidden" aria-label="Mobil menü">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="semiwide block border-b border-ink/10 py-4 text-2xl font-semibold"
            >
              {n.label}
            </a>
          ))}
          <p className="mt-5 flex gap-3 text-sm text-steel">
            {languages.map((l) => (
              <span key={l} className={l === 'TR' ? 'font-semibold text-ink' : ''}>
                {l}
              </span>
            ))}
          </p>
        </nav>
      )}
    </header>
  );
}
