import type { Metadata, Viewport } from 'next';
import './globals.css';
import SmoothAnchors from '@/components/SmoothAnchors';

export const metadata: Metadata = {
  title: 'Alufortis | Alüminyum ekstrüzyon, eloksal ve toz boya',
  description:
    '1996’dan beri alüminyumda: ekstrüzyon, eloksal, elektrostatik toz boya, kalıphane ve mekanik işlem. Pendik, İstanbul.',
};

export const viewport: Viewport = {
  themeColor: '#07090c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <SmoothAnchors />
        {children}
      </body>
    </html>
  );
}
