import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import SmoothAnchors from '@/components/SmoothAnchors';
import { allLangs, dicts, siteLangs, type Lang } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams() {
  return siteLangs().map((lang) => ({ lang }));
}

type Params = Promise<{ lang: string }>;

const isLang = (l: string): l is Lang => (allLangs as readonly string[]).includes(l);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = dicts[lang];
  const langs = siteLangs();
  return {
    metadataBase: new URL('https://alufortis.gkh.ro'),
    title: t.meta.title,
    description: t.meta.description,
    // Yalnızca yayında olan diller birbirine bağlanır
    alternates:
      langs.length > 1
        ? { languages: Object.fromEntries([...langs.map((l) => [l, `/${l}/`]), ['x-default', '/tr/']]) }
        : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: '#07090c',
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { lang } = await params;
  if (!isLang(lang) || !siteLangs().includes(lang)) notFound();
  return (
    <html lang={lang}>
      <body className="antialiased">
        <SmoothAnchors />
        {children}
      </body>
    </html>
  );
}
