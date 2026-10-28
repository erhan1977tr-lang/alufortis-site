'use client';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { heroState } from '@/lib/sceneState';
import type { Dict } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Yavaş cihazda açılış ağır çekime dönmesin: animasyonlar gerçek süresinde biter
gsap.ticker.lagSmoothing(0);

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

export default function Hero({ t }: { t: Dict['hero'] }) {
  const facts = t.facts;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        heroState.length = 7;
        heroState.intro = 1;
        return;
      }

      // Sayfanın tek koreografisi: profil kalıptan çıkarken başlık açılır
      const tl = gsap.timeline({ delay: 0.2 });
      tl.fromTo(heroState, { length: 0 }, { length: 7, duration: 2.8, ease: 'power3.out' }, 0)
        .fromTo(heroState, { intro: 0 }, { intro: 1, duration: 3.4, ease: 'expo.out' }, 0)
        .from('[data-line]', { yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: 0.09 }, 0.35)
        .from('[data-fade]', { autoAlpha: 0, y: 12, duration: 0.8, ease: 'power2.out', stagger: 0.06 }, 1.0);

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (s) => (heroState.scroll = s.progress),
      });

      const onMove = (e: PointerEvent) => {
        heroState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        heroState.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('pointermove', onMove);
      return () => window.removeEventListener('pointermove', onMove);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="hero-dark relative min-h-[100svh] overflow-hidden bg-night pt-16 text-paper">
      {/* Renkli ışık halesi ve hafif vinyet: 3D sahnenin arkasında, GPU maliyeti yok */}
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative h-[42svh] md:absolute md:inset-0 md:h-auto">
        <HeroScene />
      </div>

      <div className="pointer-events-none relative mx-auto flex max-w-[1400px] flex-col px-4 pb-10 sm:px-8 md:min-h-[calc(100svh-4rem)] md:justify-center">
        <div className="pointer-events-auto max-w-[900px]">
          <h1 className="display text-[clamp(2.4rem,6.6vw,6.6rem)]">
            {t.lines.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span data-line className={`block ${i === t.lines.length - 1 ? 'hero-gradient' : ''}`}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p data-fade className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-paper/75 sm:text-lg">
            {t.lead}
          </p>
          <div data-fade className="mt-8 flex flex-wrap gap-3">
            <a
              href="#muhendislik"
              className="rounded-full bg-paper px-6 py-3 text-[15px] font-medium text-night transition-colors hover:bg-[#f0b27a]"
            >
              {t.primary}
            </a>
            <a
              href="#iletisim"
              className="rounded-full border border-paper/30 px-6 py-3 text-[15px] font-medium transition-colors hover:border-paper"
            >
              {t.secondary}
            </a>
          </div>
        </div>

        {/* Teknik çizim antet kutusu */}
        <dl
          data-fade
          className="pointer-events-auto mt-10 grid grid-cols-3 border border-paper/15 bg-white/[0.04] backdrop-blur-md md:absolute md:right-8 md:bottom-10 md:mt-0 md:w-[min(460px,42vw)]"
        >
          {facts.map((f, i) => (
            <div
              key={f.label}
              className={`flex flex-col justify-between px-3 py-3 sm:px-4 ${i > 0 ? 'border-l' : ''} border-paper/15`}
            >
              <dt className="text-[12px] leading-tight text-paper/55">{f.label}</dt>
              <dd className="semiwide num mt-1 text-[20px] font-semibold whitespace-nowrap lg:text-[22px]">{f.value}</dd>
            </div>
          ))}
        </dl>
        <p
          data-fade
          className="mt-4 text-[11px] tracking-[0.14em] text-paper/40 uppercase md:absolute md:bottom-10 md:left-8 md:mt-0"
        >
          {t.caption}
        </p>
      </div>
    </section>
  );
}
