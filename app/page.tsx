import Header, { Wordmark } from '@/components/Header';
import Hero from '@/components/Hero';
import Production from '@/components/Production';
import { catalogs, contact, mission, nav, partners, values, vision } from '@/lib/content';

const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`;

function catalogMail(title: string) {
  return `mailto:${contact.email}?subject=${encodeURIComponent(`Katalog talebi: ${title}`)}`;
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* Kurumsal */}
        <section id="kurumsal" className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
              <h2 className="display text-[clamp(2.2rem,5vw,4.4rem)]">
                Alüminyumda güvenilir ve yenilikçi çözüm ortağınız
              </h2>
              <div className="space-y-5 text-[17px] leading-[1.6] text-ink/85 md:pt-3">
                <p>
                  Alüminyum sektöründe 30 yılı aşkın süredir edindiğimiz bilgi ve deneyimi mühendislik uzmanlığıyla
                  birleştirerek sürdürülebilir ve verimli çözümler geliştiriyoruz.
                </p>
                <p>
                  Yalnızca standart ürün satmıyoruz. Müşteriye özel tasarım, üretim ve lojistik çözümleriyle yurt içinde
                  ve yurt dışında fark yaratıyoruz. Üretim ve tesis kurulumundan satış, ihracat, yönetim ve finans
                  danışmanlığına kadar ithalat ve ihracat süreçlerinde uçtan uca hizmet veriyoruz.
                </p>
                <p>
                  Ödün vermediğimiz kalite standartları, teknolojiyi yakından takip eden yapımız, geniş ürün yelpazemiz ve
                  müşteri odaklı hizmet anlayışımızla güvenilir, hızlı ve sürdürülebilir başarıyı hedefliyoruz.
                </p>
              </div>
            </div>

            {/* Kronoloji: gerçek bir sıra olduğu için tarih çizgisi */}
            <ol className="mt-20 grid border-t border-ink/25 sm:grid-cols-2">
              <li className="border-b border-ink/15 py-6 sm:border-b-0 sm:pr-10">
                <p className="wide num text-[clamp(2.6rem,5vw,4rem)] leading-none font-[640] text-bronze">1996</p>
                <p className="mt-3 max-w-[28rem] text-[16px] leading-[1.55] text-ink/80">
                  Alüminyum alanındaki çalışmalarımız başladı.
                </p>
              </li>
              <li className="py-6 sm:border-l sm:border-ink/15 sm:pl-10">
                <p className="wide num text-[clamp(2.6rem,5vw,4rem)] leading-none font-[640]">2024</p>
                <p className="mt-3 max-w-[28rem] text-[16px] leading-[1.55] text-ink/80">
                  Tamamen öz sermayeyle Alufortis markası altında yeniden yapılandık.
                </p>
              </li>
            </ol>

            <div className="mt-24 grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="semiwide text-[22px] font-semibold">Vizyonumuz</h3>
                <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-ink/85">{vision}</p>
              </div>
              <div>
                <h3 className="semiwide text-[22px] font-semibold">Misyonumuz</h3>
                <p className="mt-4 max-w-[34rem] text-[17px] leading-[1.6] text-ink/85">{mission}</p>
              </div>
            </div>
          </div>

          {/* İş ortakları */}
          <div className="border-t border-ink/15 bg-ink text-paper">
            <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 md:py-28">
              <h3 className="max-w-[40rem] text-[17px] leading-[1.6] text-paper/75">
                Avrupa’dan Orta Doğu’ya ve Güney Amerika’ya, 11 ülkede iş ortaklarımızla çalışıyoruz.
              </h3>
              <ul className="wide mt-8 flex flex-wrap gap-x-[0.5em] text-[clamp(1.9rem,4.6vw,4rem)] leading-[1.12] font-[600] tracking-[-0.03em]">
                {partners.map((p, i) => (
                  <li key={p}>
                    {p}
                    {i < partners.length - 1 && <span className="text-paper/30">,</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Değerler */}
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-28">
            <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
              <h3 className="semiwide text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] font-[640] tracking-[-0.02em]">
                Temel ilke ve değerlerimiz
              </h3>
              <ul className="grid border-t border-ink/25 sm:grid-cols-2 sm:gap-x-10">
                {values.map((v) => (
                  <li key={v} className="border-b border-ink/15 py-4 text-[17px] leading-[1.45]">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Production />

        {/* Kataloglar */}
        <section id="kataloglar" className="border-t border-ink/15">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
              <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">Kataloglar</h2>
              <p className="max-w-[32rem] text-[17px] leading-[1.6] text-ink/80 md:justify-self-end">
                Sistem kataloglarımızın güncel sürümünü e-postayla gönderiyoruz. İhtiyacınız olan kataloğu seçin.
              </p>
            </div>
            <ul className="mt-14 border-t border-ink/30">
              {catalogs.map((c) => (
                <li key={c.title}>
                  <a
                    href={catalogMail(c.title)}
                    className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-ink/15 px-1 py-6 transition-colors hover:bg-ink hover:text-paper sm:grid-cols-[1.4fr_1fr_auto] sm:px-4"
                  >
                    <span className="semiwide text-[clamp(1.25rem,2.4vw,1.9rem)] leading-tight font-[620] tracking-[-0.015em]">
                      {c.title}
                    </span>
                    <span className="hidden text-[15px] text-steel group-hover:text-paper/70 sm:block">{c.note}</span>
                    <span className="text-[14px] font-medium whitespace-nowrap">Katalog isteyin</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* İletişim */}
        <section id="iletisim" className="bg-ink text-paper">
          <div className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8 md:py-32">
            <h2 className="display text-[clamp(2.4rem,6vw,5rem)]">Projenizi konuşalım</h2>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.6] text-paper/75">
              Profil, yüzey işlemi ya da size özel bir çözüm için bize yazın veya arayın.
            </p>

            <div className="mt-14 grid gap-10 border-t border-paper/20 pt-10 md:grid-cols-3">
              <div>
                <p className="text-[14px] text-paper/60">E-posta</p>
                <a href={`mailto:${contact.email}`} className="semiwide link-underline mt-2 inline-block text-[clamp(1.4rem,2.6vw,2rem)] font-semibold">
                  {contact.email}
                </a>
              </div>
              <div>
                <p className="text-[14px] text-paper/60">Telefon</p>
                <a href={contact.phoneHref} className="semiwide num link-underline mt-2 inline-block text-[clamp(1.4rem,2.6vw,2rem)] font-semibold">
                  {contact.phone}
                </a>
              </div>
              <div>
                <p className="text-[14px] text-paper/60">Adres</p>
                <address className="mt-2 text-[17px] leading-[1.55] not-italic">{contact.address}</address>
                <a href={mapsHref} target="_blank" rel="noopener" className="link-underline mt-3 inline-block text-[15px] text-paper/80">
                  Haritada açın
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper/70">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 border-t border-paper/15 px-4 py-10 text-[14px] sm:px-8 md:flex-row md:items-center md:justify-between">
          <Wordmark className="text-[18px] text-paper" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Alt menü">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-paper">
                {n.label}
              </a>
            ))}
            <a href={contact.twitter} target="_blank" rel="noopener" className="hover:text-paper">
              X (Twitter)
            </a>
          </nav>
          <p>© {new Date().getFullYear()} Alufortis. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </>
  );
}
