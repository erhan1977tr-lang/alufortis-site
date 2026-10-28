'use client';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { finishes, stages, type FinishKey } from '@/lib/content';
import type { Dict } from '@/lib/i18n';
import { productionState } from '@/lib/sceneState';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ProductionScene = dynamic(() => import('./three/ProductionScene'), { ssr: false });

// Her aşamada 3D profilin alacağı hâl
const stagePose: Record<string, { length: number; die: number }> = {
  kaliphane: { length: 0.6, die: 1 },
  ekstruzyon: { length: 6, die: 1 },
  eloksal: { length: 5, die: 0 },
  'toz-boya': { length: 5, die: 0 },
  'mekanik-islem': { length: 2.2, die: 0 },
};

export default function Production({ t }: { t: Dict['production'] }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [finishKey, setFinishKey] = useState<FinishKey>(stages[0].finish);

  const apply = (i: number, finish?: FinishKey) => {
    const step = stages[i];
    const f = finish ?? step.finish;
    productionState.finish = finishes[f];
    productionState.length = stagePose[step.id].length;
    productionState.die = stagePose[step.id].die;
    setActive(i);
    setFinishKey(f);
  };

  useGSAP(
    () => {
      apply(0);
      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (s) => s.isActive && apply(i),
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="uretim" className="relative border-t border-ink/15 bg-paper-2">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <header className="max-w-[46rem] pt-24 pb-10 md:pt-32">
          <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.title}</h2>
          <p className="mt-6 text-lg leading-[1.55] text-ink/80">{t.lead}</p>
        </header>

        <div className="grid gap-x-12 md:grid-cols-[1fr_1fr]">
          {/* Yapışkan 3D sahne */}
          <div className="sticky top-16 z-10 -mx-4 h-[38svh] border-b border-ink/15 bg-paper-2 sm:-mx-8 md:top-24 md:mx-0 md:h-[calc(100svh-8rem)] md:border-0 md:bg-transparent">
            <ProductionScene />
            <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 text-[13px] text-steel sm:left-8 md:left-0">
              <span className="inline-block h-3 w-3 rounded-full border border-ink/20" style={{ background: finishes[finishKey].color }} />
              {t.finishes[finishKey]}
            </div>
          </div>

          <ol className="pb-24 md:pb-40">
            {stages.map((stage, i) => {
              const step = t.steps[stage.id];
              return (
              <li
                key={stage.id}
                id={stage.id}
                data-step
                className={`flex min-h-[70svh] flex-col justify-center border-t border-ink/15 py-14 transition-opacity duration-500 md:min-h-[85svh] ${
                  active === i ? 'opacity-100' : 'opacity-45'
                }`}
              >
                <p className="semiwide num text-[15px] font-semibold text-bronze">
                  {String(i + 1).padStart(2, '0')}
                  <span className="text-steel"> / {String(stages.length).padStart(2, '0')}</span>
                </p>
                <h3 className="semiwide mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[1.05] font-[640] tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-[36rem] text-[17px] leading-[1.6] text-ink/80">{step.text}</p>

                {'specs' in step && (
                  <dl className="mt-8 max-w-[36rem] border-t border-ink/25">
                    {step.specs.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-6 border-b border-ink/15 py-3">
                        <dt className="text-[15px] text-steel">{k}</dt>
                        <dd className="semiwide num text-right text-[17px] font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {'swatches' in stage && (
                  <div className="mt-8">
                    <p className="text-[14px] text-steel">{t.pickTone}</p>
                    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t.tonesLabel}>
                      {stage.swatches.map((s) => (
                        <button
                          key={s}
                          role="radio"
                          aria-checked={finishKey === s && active === i}
                          onClick={() => apply(i, s)}
                          className={`flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-[14px] transition-colors ${
                            finishKey === s && active === i ? 'border-ink bg-paper' : 'border-ink/20 hover:border-ink/50'
                          }`}
                        >
                          <span className="h-6 w-6 rounded-full border border-ink/15" style={{ background: finishes[s].color }} />
                          {t.toneShort[s as keyof typeof t.toneShort]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {'list' in step && (
                  <ul className="mt-8 grid max-w-[36rem] gap-x-6 border-t border-ink/25 sm:grid-cols-2">
                    {step.list.map((m) => (
                      <li key={m} className="border-b border-ink/15 py-3 text-[16px]">
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
