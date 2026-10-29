import Header, { Wordmark } from '@/components/Header';
import Hero from '@/components/Hero';
import Production from '@/components/Production';
import Photo from '@/components/Photo';
import { contact } from '@/lib/content';
import { dicts, siteLangs, type Lang } from '@/lib/i18n';

const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`;

const pad = (n: number) => String(n).padStart(2, '0');

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Lang;
  const t = dicts[lang];
  const langs = siteLangs();
  const catalogMail = (title: string) =>
    `mailto:${contact.email}?subject=${encodeURIComponent(`${t.catalogs.mailSubject}: ${title}`)}`;

  return (
    <>
      <Header t={t} lang={lang} langs={langs} />
      <main>
        <Hero t={t.hero} />

        {/* Slogan */}
        <section className="border-t border-white/10 bg-night text-paper" aria-label={t.motto.join(' ')}>
          <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 md:py-20">
            <p className="wide text-[clamp(1.6rem,4.2vw,3.6rem)] leading-[1.05] font-[640] tracking-[-0.03em]">
              {t.motto.map((m, i) => (
                <span key={m} className={`block ${i === 1 ? 'hero-gradient' : i === 2 ? 'text-paper/45' : ''}`}>
                  {m}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* Kurumsal */}
        <section id="kurumsal" className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
              <h2 className="display text-[clamp(2.2rem,5vw,4.4rem)]">{t.about.title}</h2>
              <div className="space-y-5 text-[17px] leading-[1.6] text-ink/85 md:pt-3">
                {t.about.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>

            {/* Kronoloji */}
            <ol className="mt-20 grid border-t border-ink/25 sm:grid-cols-2">
              {t.about.timeline.map((e, i) => (
                <li
                  key={e.year}
                  className={i === 0 ? 'border-b border-ink/15 py-6 sm:border-b-0 sm:pr-10' : 'py-6 sm:border-l sm:border-ink/15 sm:pl-10'}
                >
                  <p className={`wide num text-[clamp(2.6rem,5vw,4rem)] leading-none font-[640] ${i === 0 ? 'text-bronze' : ''}`}>
                    {e.year}
                  </p>
                  <p className="mt-3 max-w-[28rem] text-[16px] leading-[1.55] text-ink/80">{e.text}</p>
                </li>
              ))}
            </ol>

            {/* Neden kurulduk, neyi değiştirmek istiyoruz */}
            <div className="mt-24 grid gap-14 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="semiwide text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] font-[640] tracking-[-0.02em]">
                  {t.why.title}
                </h3>
                <div className="mt-6 space-y-4 text-[17px] leading-[1.6] text-ink/85">
                  {t.why.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  <p className="semiwide text-[20px] font-semibold text-bronze">{t.why.emphasis}</p>
                </div>
              </div>
              <div>
                <h3 className="semiwide text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] font-[640] tracking-[-0.02em]">
                  {t.why.changeTitle}
                </h3>
                <ul className="mt-6 border-t border-ink/25">
                  {t.why.change.map((c) => (
                    <li key={c} className="border-b border-ink/15 py-3 text-[17px] text-ink/60 line-through decoration-bronze/70">
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="semiwide mt-5 text-[20px] font-semibold">{t.why.changeEnd}</p>
              </div>
            </div>

            <div className="mt-24 grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="semiwide text-[22px] font-semibold">{t.about.visionTitle}</h3>
                <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-ink/85">{t.about.vision}</p>
              </div>
              <div>
                <h3 className="semiwide text-[22px] font-semibold">{t.about.missionTitle}</h3>
                <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-ink/85">{t.about.mission}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Felsefe */}
        <section className="bg-night text-paper">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.philosophy.title}</h2>
            <ol className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper/15 bg-paper/15 sm:grid-cols-4 lg:grid-cols-7">
              {t.philosophy.flow.map((f, i) => (
                <li key={f} className="bg-night px-4 py-6">
                  <p className="num text-[13px] font-semibold text-[#f0b27a]">{pad(i + 1)}</p>
                  <p className="semiwide mt-2 text-[17px] leading-tight font-semibold">{f}</p>
                </li>
              ))}
            </ol>
            <blockquote className="mt-16 max-w-[52rem]">
              <p className="semiwide text-[clamp(1.4rem,2.6vw,2.2rem)] leading-[1.2] font-[600] tracking-[-0.015em]">
                {t.philosophy.quote[0]} <span className="hero-gradient">{t.philosophy.quote[1]}</span>
              </p>
            </blockquote>
          </div>
        </section>

        {/* Neden Alufortis + projeyle başlıyoruz */}
        <section className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <h2 className="display text-[clamp(2.2rem,5vw,4.4rem)]">{t.reasons.title}</h2>
            <ul className="mt-14 grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
              {t.reasons.items.map((r, i) => (
                <li key={r.title} className="bg-paper p-6 md:p-8">
                  <p className="num text-[13px] font-semibold text-bronze">{pad(i + 1)}</p>
                  <h3 className="semiwide mt-3 text-[22px] leading-tight font-semibold">{r.title}</h3>
                  <p className="mt-3 text-[16px] leading-[1.55] text-ink/75">{r.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-24 grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
              <h3 className="display text-[clamp(2rem,4.4vw,3.8rem)]">{t.project.title}</h3>
              <div className="text-[18px] leading-[1.6] md:pt-3">
                <p className="text-ink/75">{t.project.intro}</p>
                <ul className="mt-3 border-t border-ink/25">
                  {t.project.points.map((p) => (
                    <li key={p} className="semiwide border-b border-ink/15 py-3 text-[22px] font-semibold">
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="semiwide mt-6 text-[22px] font-semibold text-bronze">{t.project.end}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tam entegre çözümler */}
        <section className="bg-ink text-paper">
          <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 md:py-28">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
              <h2 className="display text-[clamp(2.2rem,5vw,4.4rem)]">{t.integrated.title}</h2>
              <p className="max-w-[30rem] text-[18px] leading-[1.55] text-paper/75 md:justify-self-end">{t.integrated.lead}</p>
            </div>
            <ul className="wide mt-12 flex flex-wrap gap-x-[0.5em] text-[clamp(1.6rem,3.8vw,3.2rem)] leading-[1.15] font-[600] tracking-[-0.03em]">
              {t.integrated.items.map((p, i) => (
                <li key={p}>
                  {p}
                  {i < t.integrated.items.length - 1 && <span className="ml-[0.3em] text-[#f0b27a]">·</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mühendislik ve kabiliyetler */}
        <section id="muhendislik" className="bg-night text-paper">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <header className="max-w-[48rem]">
              <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.capabilities.title}</h2>
              <p className="mt-6 text-lg leading-[1.55] text-paper/70">{t.capabilities.lead}</p>
            </header>
            <div className="mt-16 space-y-20 md:space-y-28">
              {t.capabilities.items.map((c, i) => (
                <article
                  key={c.id}
                  id={c.id}
                  className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
                >
                  <div className={`overflow-hidden rounded-sm border border-paper/10 ${i % 2 ? 'md:order-2' : ''}`}>
                    <Photo name={c.image} alt={c.title} className="aspect-[3/2] w-full" />
                  </div>
                  <div>
                    <p className="semiwide num text-[15px] font-semibold text-[#f0b27a]">
                      {pad(i + 1)}
                      <span className="text-paper/40"> / {pad(t.capabilities.items.length)}</span>
                    </p>
                    <h3 className="semiwide mt-3 text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.05] font-[640] tracking-[-0.02em]">
                      {c.title}
                    </h3>
                    <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.6] text-paper/75">{c.text}</p>
                    <ul className="mt-7 flex flex-wrap gap-2">
                      {c.tags.map((tag) => (
                        <li key={tag} className="rounded-full border border-paper/20 px-3.5 py-1.5 text-[14px] text-paper/85">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Production t={t.production} />

        {/* Rakamlar ve dünya */}
        <section className="relative overflow-hidden bg-night text-paper">
          <Photo name="tesis" alt="" className="absolute inset-0 h-full w-full opacity-35" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/60 to-night" />
          <div className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.numbers.title}</h2>
            <dl className="mt-14 grid border-t border-paper/25 sm:grid-cols-3">
              {t.numbers.items.map((n, i) => (
                <div key={n.label} className={`border-b border-paper/15 py-8 sm:border-b-0 ${i > 0 ? 'sm:border-l sm:pl-10' : ''}`}>
                  <dd className="wide num text-[clamp(3.4rem,7vw,6rem)] leading-none font-[640] hero-gradient">{n.value}</dd>
                  <dt className="mt-3 text-[16px] text-paper/70">{n.label}</dt>
                </div>
              ))}
            </dl>
            <ul className="mt-8 flex flex-wrap gap-3">
              {t.numbers.qualities.map((q) => (
                <li key={q} className="rounded-full border border-paper/25 px-4 py-2 text-[15px]">
                  {q}
                </li>
              ))}
            </ul>

            <div className="mt-24 grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
              <h3 className="semiwide text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.08] font-[640] tracking-[-0.02em]">
                {t.global.title}
              </h3>
              <p className="text-[17px] leading-[1.6] text-paper/75 md:pt-2">{t.global.text}</p>
            </div>
            <p className="mt-14 text-[15px] text-paper/60">{t.global.partnersLead}</p>
            <ul className="wide mt-4 flex flex-wrap gap-x-[0.5em] text-[clamp(1.6rem,3.8vw,3.4rem)] leading-[1.12] font-[600] tracking-[-0.03em]">
              {t.global.partners.map((p, i) => (
                <li key={p}>
                  {p}
                  {i < t.global.partners.length - 1 && <span className="text-paper/30">,</span>}
                </li>
              ))}
            </ul>
            <p className="semiwide mt-16 text-[clamp(1.2rem,2vw,1.6rem)] font-semibold text-paper/80">
              {t.global.tagline.join(' ')}
            </p>
          </div>
        </section>

        {/* Sektörler */}
        <section id="sektorler" className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
              <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.sectors.title}</h2>
              <p className="max-w-[32rem] text-[17px] leading-[1.6] text-ink/80 md:justify-self-end">{t.sectors.lead}</p>
            </div>
            <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.sectors.items.map((s, i) => (
                <li key={s.image} className="group relative overflow-hidden rounded-sm bg-night text-paper">
                  <Photo
                    name={s.image}
                    alt={s.title}
                    className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="num text-[12px] font-semibold text-[#f0b27a]">{pad(i + 1)}</p>
                    <h3 className="semiwide mt-1 text-[20px] leading-tight font-semibold">{s.title}</h3>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fikirden teslimata */}
        <section className="bg-ink text-paper">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-28">
            <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.process.title}</h2>
            <ol className="mt-14 grid gap-px overflow-hidden border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-5">
              {t.process.steps.map((s, i) => (
                <li key={s} className="bg-ink px-5 py-7">
                  <p className="wide num text-[34px] leading-none font-[640] text-paper/25">{pad(i + 1)}</p>
                  <p className="semiwide mt-4 text-[18px] leading-tight font-semibold">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Değerler */}
        <section className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-28">
            <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
              <h2 className="semiwide text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] font-[640] tracking-[-0.02em]">
                {t.about.valuesTitle}
              </h2>
              <ul className="grid border-t border-ink/25 sm:grid-cols-2 sm:gap-x-10">
                {t.about.values.map((v) => (
                  <li key={v} className="border-b border-ink/15 py-4 text-[17px] leading-[1.45]">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Kataloglar */}
        <section id="kataloglar" className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
              <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">{t.catalogs.title}</h2>
              <p className="max-w-[32rem] text-[17px] leading-[1.6] text-ink/80 md:justify-self-end">{t.catalogs.lead}</p>
            </div>
            <ul className="mt-14 border-t border-ink/30">
              {t.catalogs.items.map((c) => (
                <li key={c.title}>
                  <a
                    href={catalogMail(c.title)}
                    className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-ink/15 px-1 py-6 transition-colors hover:bg-ink hover:text-paper sm:grid-cols-[1.4fr_1fr_auto] sm:px-4"
                  >
                    <span className="semiwide text-[clamp(1.25rem,2.4vw,1.9rem)] leading-tight font-[620] tracking-[-0.015em]">
                      {c.title}
                    </span>
                    <span className="hidden text-[15px] text-steel group-hover:text-paper/70 sm:block">{c.note}</span>
                    <span className="text-[14px] font-medium whitespace-nowrap">{t.catalogs.request}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* İletişim */}
        <section id="iletisim" className="bg-ink text-paper">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <p className="semiwide text-[15px] font-semibold tracking-[0.04em] text-[#f0b27a]">{t.contact.tagline}</p>
            <h2 className="display mt-4 text-[clamp(2.4rem,6vw,5rem)]">{t.contact.title}</h2>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.6] text-paper/75">{t.contact.lead}</p>

            <div className="mt-14 grid gap-10 border-t border-paper/20 pt-10 md:grid-cols-3">
              <div>
                <p className="text-[14px] text-paper/60">{t.contact.email}</p>
                <a href={`mailto:${contact.email}`} className="semiwide link-underline mt-2 inline-block text-[clamp(1.4rem,2.6vw,2rem)] font-semibold">
                  {contact.email}
                </a>
              </div>
              <div>
                <p className="text-[14px] text-paper/60">{t.contact.phone}</p>
                <a href={contact.phoneHref} className="semiwide num link-underline mt-2 inline-block text-[clamp(1.4rem,2.6vw,2rem)] font-semibold">
                  {contact.phone}
                </a>
              </div>
              <div>
                <p className="text-[14px] text-paper/60">{t.contact.address}</p>
                <address className="mt-2 text-[17px] leading-[1.55] not-italic">{contact.address}</address>
                <a href={mapsHref} target="_blank" rel="noopener" className="link-underline mt-3 inline-block text-[15px] text-paper/80">
                  {t.contact.map}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper/70">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 border-t border-paper/15 px-4 py-10 text-[14px] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Wordmark className="text-[18px] text-paper" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label={t.ui.footerNav}>
            {t.nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-paper">
                {n.label}
              </a>
            ))}
            <a href={contact.twitter} target="_blank" rel="noopener" className="hover:text-paper">
              X (Twitter)
            </a>
          </nav>
          <div className="text-[13px] lg:text-right">
            <p>© {new Date().getFullYear()} Alufortis. {t.ui.rights}</p>
            <p className="mt-1 text-paper/45">{t.ui.imagesNote}</p>
            <p className="mt-3 text-paper/55">
              Designed by{' '}
              <a href="https://gkhdigital.ro" target="_blank" rel="noopener" className="link-underline text-paper/80 hover:text-paper">
                gkhdigital.ro
              </a>{' '}
              &amp;{' '}
              <a href="https://gkhdigital.com" target="_blank" rel="noopener" className="link-underline text-paper/80 hover:text-paper">
                gkhdigital.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
