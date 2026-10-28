'use client';
import { useState } from 'react';
import type { Dict, Lang } from '@/lib/i18n';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wide font-[720] tracking-[-0.02em] ${className}`}>
      ALUFORTIS
    </span>
  );
}

// Diller arasında tam sayfa geçişi yapılır; her dil ayrı bir statik sayfadır.
const base = process.env.NEXT_BASE_PATH || '';

type Props = { t: Dict; lang: Lang; langs: Lang[] };

function LangLinks({ lang, langs, className, onPick }: { lang: Lang; langs: Lang[]; className: string; onPick?: () => void }) {
  if (langs.length < 2) return null;
  return (
    <>
      {langs.map((l) => (
        <li key={l} className={className}>
          <a
            href={`${base}/${l}/`}
            hrefLang={l}
            lang={l}
            onClick={onPick}
            aria-current={l === lang ? 'page' : undefined}
            className={l === lang ? 'font-semibold text-paper' : 'transition-colors hover:text-paper'}
          >
            {l.toUpperCase()}
          </a>
        </li>
      ))}
    </>
  );
}

export default function Header({ t, lang, langs }: Props) {
  const [open, setOpen] = useState(false);
  const nav = t.nav;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-night/75 text-paper backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <a href="#top" className="text-[19px]" aria-label={t.ui.home}>
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-6 text-[15px] lg:flex" aria-label={t.ui.mainNav}>
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="text-paper/75 transition-colors hover:text-paper">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {langs.length > 1 && (
            <ul className="flex gap-2 text-[13px] text-paper/50" aria-label={t.ui.language}>
              <LangLinks lang={lang} langs={langs} className="" />
            </ul>
          )}
          <a
            href="#iletisim"
            className="rounded-full bg-paper px-4 py-2 text-[14px] font-medium text-night transition-colors hover:bg-[#f0b27a]"
          >
            {t.ui.quote}
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobil-menu"
          aria-label={open ? t.ui.menuClose : t.ui.menuOpen}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 block h-[2px] w-6 bg-paper transition-transform ${open ? 'top-[5px] rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 block h-[2px] w-6 bg-paper transition-transform ${open ? 'top-[5px] -rotate-45' : 'top-[10px]'}`} />
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobil-menu" className="border-t border-white/10 bg-night px-4 pb-6 lg:hidden" aria-label={t.ui.mobileNav}>
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
          {langs.length > 1 && (
            <ul className="mt-5 flex gap-4 text-base text-paper/50" aria-label={t.ui.language}>
              <LangLinks lang={lang} langs={langs} className="" onPick={() => setOpen(false)} />
            </ul>
          )}
        </nav>
      )}
    </header>
  );
}
