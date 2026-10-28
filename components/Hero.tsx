'use client';
import { useEffect, useRef } from 'react';
import type { Dict } from '@/lib/i18n';

const base = process.env.NEXT_BASE_PATH || '';
const VIDEO = `${base}/video/hero-scrub.mp4`;
const POSTER = `${base}/video/hero-poster.jpg`;

// Filmin her sahnesi kaydırma ilerlemesinin bir aralığında görünür (canlı sitedeki zamanlama)
const scenes = [
  { a: 0, b: 0.13, pos: 'left-[clamp(24px,6vw,96px)] top-1/2 -translate-y-1/2 w-[min(46vw,640px)]' },
  { a: 0.145, b: 0.29, pos: 'left-[clamp(24px,6vw,96px)] top-[64%] -translate-y-1/2 w-[min(44vw,620px)]' },
  { a: 0.305, b: 0.445, pos: 'right-[clamp(24px,6vw,96px)] top-1/2 -translate-y-1/2 w-[min(40vw,560px)] text-right' },
  { a: 0.455, b: 0.59, pos: 'right-[clamp(24px,6vw,96px)] top-1/2 -translate-y-1/2 w-[min(40vw,560px)] text-right' },
  { a: 0.6, b: 0.77, pos: 'left-[clamp(24px,6vw,96px)] top-1/2 -translate-y-1/2 w-[min(44vw,620px)]' },
  { a: 0.785, b: 1, pos: 'left-1/2 top-[calc(4rem+3vh)] -translate-x-1/2 w-[min(92vw,900px)] text-center' },
];

// Telefon, dikey tablet ve azaltılmış hareket: film kaydırmaya bağlanmaz, sessiz döngüde arkada oynar
const STATIC_QUERY =
  '(max-width: 720px), (orientation: portrait) and (max-width: 1024px), (orientation: portrait) and (pointer: coarse), (orientation: landscape) and (pointer: coarse) and (max-height: 560px), (prefers-reduced-motion: reduce)';

const smooth = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Hero({ t }: { t: Dict['hero'] }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bands = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = root.current!;
    const st = stage.current!;
    const v = video.current!;
    const mq = matchMedia(STATIC_QUERY);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let target = 0;
    let shown = 0;
    let raf = 0;
    let ready = false;
    let seekBusy = false;
    let pending: number | null = null;
    let blobUrl = '';
    let ctrl: AbortController | null = null;
    let scrub = false;

    const progress = () => {
      const range = section.offsetHeight - innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / range)) : 0;
    };
    const seek = (time: number) => {
      if (!v.duration) return;
      if (seekBusy) return void (pending = time);
      seekBusy = true;
      v.currentTime = time;
    };
    const onSeeked = () => {
      seekBusy = false;
      if (pending !== null) {
        const p = pending;
        pending = null;
        seek(p);
      }
    };
    const captions = (p: number) => {
      scenes.forEach((s, i) => {
        const el = bands.current[i];
        if (!el) return;
        const f = Math.min(0.02, (s.b - s.a) / 3);
        const first = i === 0;
        const last = i === scenes.length - 1;
        const op = (first ? 1 : smooth(p, s.a, s.a + f)) * (last ? 1 : 1 - smooth(p, s.b - f, s.b));
        const k = first ? 1 : Math.min(1, Math.max(0, (p - s.a) / 0.05));
        el.style.opacity = op.toFixed(3);
        el.style.setProperty('--k', k.toFixed(3));
        el.style.pointerEvents = op > 0.05 ? 'auto' : 'none';
      });
      st.classList.toggle('scrolled', p > 0.04);
    };
    const tick = () => {
      shown += (target - shown) * 0.16;
      if (Math.abs(target - shown) < 0.0005) shown = target;
      if (ready) seek(shown * v.duration);
      captions(shown);
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Kaydırarak sarmada her konuma anında atlanabilsin diye film bir kez bütün olarak belleğe alınır
    const loadWhole = async () => {
      st.classList.add('loading');
      ctrl = new AbortController();
      try {
        const res = await fetch(VIDEO, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        blobUrl = URL.createObjectURL(await res.blob());
        v.src = blobUrl;
        v.load();
        v.addEventListener(
          'canplay',
          () => {
            ready = true;
            st.classList.add('video-ready');
            st.classList.remove('loading');
            seek(progress() * v.duration);
          },
          { once: true },
        );
      } catch {
        st.classList.remove('loading');
      }
    };

    const enableScrub = () => {
      if (scrub) return;
      scrub = true;
      st.classList.remove('mobile-play');
      v.pause();
      v.loop = false;
      v.autoplay = false;
      if (!blobUrl) loadWhole();
      else {
        v.src = blobUrl;
        ready = false;
        v.addEventListener('canplay', () => ((ready = true), seek(progress() * v.duration)), { once: true });
      }
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    };
    const disableScrub = () => {
      scrub = false;
      ready = false;
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      raf = 0;
      if (reduce.matches) return;
      v.loop = true;
      v.muted = true;
      v.autoplay = true;
      v.src = blobUrl || VIDEO;
      v.addEventListener('playing', () => st.classList.add('mobile-play'), { once: true });
      v.play().catch(() => {});
    };
    const apply = () => (mq.matches ? disableScrub() : enableScrub());

    v.addEventListener('seeked', onSeeked);
    mq.addEventListener('change', apply);
    apply();
    return () => {
      ctrl?.abort();
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      mq.removeEventListener('change', apply);
      v.removeEventListener('seeked', onSeeked);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, []);

  const film = t.film;
  const last = film.length - 1;
  const cta = (
    <div className="mt-7 flex flex-wrap gap-3 [.text-center_&]:justify-center">
      <a
        href="#iletisim"
        className="rounded-full bg-paper px-6 py-3 text-[15px] font-medium text-night transition-colors hover:bg-[#f0b27a]"
      >
        {t.secondary}
      </a>
      <a
        href="#muhendislik"
        className="rounded-full border border-paper/30 bg-night/30 px-6 py-3 text-[15px] font-medium backdrop-blur-sm transition-colors hover:border-paper"
      >
        {t.primary}
      </a>
    </div>
  );

  return (
    <section ref={root} id="top" className="film-hero relative bg-night text-paper">
      <div ref={stage} className="film-stage sticky top-0 h-[100svh] overflow-hidden">
        {/* Film gelene kadar ilk kare görünür; film hazır olunca üstüne yumuşakça geçer */}
        <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${POSTER}')` }} />
        <video
          ref={video}
          aria-hidden
          tabIndex={-1}
          muted
          playsInline
          preload="none"
          poster={POSTER}
          className="film-video pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_45%,rgb(7_9_12/0)_35%,rgb(7_9_12/0.62)_100%)]"
        />

        {/* Masaüstü: sahne yazıları kaydırmayla gelir gider */}
        {film.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              bands.current[i] = el;
            }}
            className={`film-band absolute ${scenes[i].pos}`}
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {i === 0 ? (
              <h1 className="display text-[clamp(2.4rem,5.4vw,5.6rem)]">
                {t.lines.map((line, j) => (
                  <span key={line} className={`block ${j === t.lines.length - 1 ? 'hero-gradient' : ''}`}>
                    {line}
                  </span>
                ))}
              </h1>
            ) : (
              <h2 className="semiwide text-[clamp(1.9rem,3.6vw,3.4rem)] leading-[1.04] font-[680] tracking-[-0.02em]">
                {s.title}
              </h2>
            )}
            <p className="film-sub mt-4 text-[clamp(16px,1.4vw,20px)] leading-[1.5] text-paper/80">{s.sub}</p>
            {i === 0 && <p className="mt-3 max-w-[34rem] text-[16px] leading-[1.55] text-paper/65">{t.lead}</p>}
            {i === last && cta}
            {i === last && (
              <dl className="mx-auto mt-8 grid max-w-[460px] grid-cols-3 border border-paper/15 bg-white/[0.04] text-left backdrop-blur-md">
                {t.facts.map((f, j) => (
                  <div key={f.label} className={`px-3 py-3 sm:px-4 ${j > 0 ? 'border-l' : ''} border-paper/15`}>
                    <dt className="text-[12px] leading-tight text-paper/55">{f.label}</dt>
                    <dd className="semiwide num mt-1 text-[20px] font-semibold whitespace-nowrap">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}

        {/* Telefon: tek parça açılış, film arkada döner */}
        <div className="film-static absolute inset-0 flex-col justify-end gap-4 bg-[linear-gradient(180deg,rgb(7_9_12/0.1)_22%,rgb(7_9_12/0.82)_62%,rgb(7_9_12/0.95)_100%)] px-4 pt-20 pb-8 sm:px-8">
          <h1 className="display text-[clamp(2.4rem,9vw,3.4rem)]">
            {t.lines.map((line, j) => (
              <span key={line} className={`block ${j === t.lines.length - 1 ? 'hero-gradient' : ''}`}>
                {line}
              </span>
            ))}
          </h1>
          <p className="max-w-[34rem] text-[16px] leading-[1.55] text-paper/75">{t.lead}</p>
          {cta}
          <dl className="mt-2 grid grid-cols-3 border border-paper/15 bg-white/[0.04] backdrop-blur-md">
            {t.facts.map((f, j) => (
              <div key={f.label} className={`px-3 py-3 ${j > 0 ? 'border-l' : ''} border-paper/15`}>
                <dt className="text-[12px] leading-tight text-paper/55">{f.label}</dt>
                <dd className="semiwide num mt-1 text-[20px] font-semibold whitespace-nowrap">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          aria-hidden
          className="film-cue absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-paper/20 bg-night/55 px-3.5 py-2 text-[12px] tracking-[0.12em] text-paper/75 uppercase backdrop-blur-md transition-opacity duration-500"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="film-cue-arrow h-3.5 w-3.5">
            <path d="M3 6l5 5 5-5" />
          </svg>
          {t.cue}
        </div>
        <p className="film-caption absolute bottom-7 left-[clamp(24px,6vw,96px)] text-[11px] tracking-[0.14em] text-paper/45 uppercase">
          {t.caption}
        </p>
      </div>
    </section>
  );
}
