'use client';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { heroState } from '@/lib/sceneState';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

const facts = [
  { label: 'Alüminyumda başlangıç', value: '1996' },
  { label: 'Alufortis markası', value: '2024' },
  { label: 'İş ortağı olan ülke', value: '11' },
  { label: 'Yıllık ekstrüzyon', value: '20.000 t' },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        heroState.length = 7;
        return;
      }

      // Sayfanın tek koreografisi: profil kalıptan çıkarken başlık açılır
      const tl = gsap.timeline({ delay: 0.2 });
      tl.fromTo(heroState, { length: 0 }, { length: 7, duration: 2.8, ease: 'power3.out' }, 0)
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
    <section ref={root} id="top" className="relative min-h-[100svh] overflow-hidden pt-16">
      <div className="relative h-[42svh] md:absolute md:inset-0 md:h-auto">
        <HeroScene />
      </div>

      <div className="pointer-events-none relative mx-auto flex max-w-[1400px] flex-col px-4 pb-10 sm:px-8 md:min-h-[calc(100svh-4rem)] md:justify-center">
        <div className="pointer-events-auto max-w-[760px]">
          <h1 className="display text-[clamp(3rem,9.5vw,8.6rem)]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">Kalite ve</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">güvenin</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">sembolü</span>
            </span>
          </h1>
          <p data-fade className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-ink/80 sm:text-lg">
            Tasarım, danışmanlık, ürün, lojistik ve size özel çözümleri tek noktadan sunuyoruz. Kalıptan nihai
            ürüne kadar alüminyumun her aşaması bizde.
          </p>
          <div data-fade className="mt-8 flex flex-wrap gap-3">
            <a
              href="#kataloglar"
              className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-bronze"
            >
              Katalogları inceleyin
            </a>
            <a
              href="#uretim"
              className="rounded-full border border-ink/30 px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink"
            >
              Üretim tesislerimiz
            </a>
          </div>
        </div>

        {/* Teknik çizim antet kutusu */}
        <dl
          data-fade
          className="pointer-events-auto mt-10 grid grid-cols-2 border border-ink/25 bg-paper/70 backdrop-blur-sm sm:grid-cols-4 md:absolute md:right-8 md:bottom-10 md:mt-0 md:w-[min(560px,46vw)]"
        >
          {facts.map((f, i) => (
            <div
              key={f.label}
              className={`px-4 py-3 ${i % 2 === 1 ? 'border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l' : ''} border-ink/25`}
            >
              <dt className="text-[12px] leading-tight text-steel">{f.label}</dt>
              <dd className="semiwide num mt-1 text-[20px] font-semibold whitespace-nowrap lg:text-[22px]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
