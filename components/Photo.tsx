import { existsSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.NEXT_BASE_PATH || '';
const exts = ['webp', 'jpg'];

// Derleme anında public/gorseller içinde görsel varsa kullanılır; yoksa yerine koyu, taramalı bir alan çizilir.
// Böylece görseller sonradan eklendiğinde kod değişmeden sayfaya girer.
export default function Photo({ name, alt, className = '' }: { name: string; alt: string; className?: string }) {
  const ext = exts.find((e) => existsSync(join(process.cwd(), 'public', 'gorseller', `${name}.${e}`)));
  if (!ext) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`photo-fallback relative overflow-hidden bg-[#141a21] ${className}`}
      >
        <div aria-hidden className="hatch absolute inset-0 opacity-25" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}/gorseller/${name}.${ext}`}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
