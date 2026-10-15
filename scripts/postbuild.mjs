// Build sonrası: hash'li dosyalar için önbellek kuralı ekler ve out/ klasörünü yayına uygunluk için denetler.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = 'out';
const fail = (msg) => {
  console.error(`postbuild: ${msg}`);
  process.exit(1);
};

if (!existsSync(join(out, 'index.html'))) fail('out/index.html bulunamadı');
if (!existsSync(join(out, '404.html'))) fail('out/404.html bulunamadı');
if (!existsSync(join(out, '.htaccess'))) fail('out/.htaccess bulunamadı (public/.htaccess eksik)');
if (existsSync(join(out, 'CNAME'))) fail('out/CNAME bulundu; GitHub Pages ayarı kalmış');

// _next/static altındaki dosya adları içerik özeti (hash) taşır, bu yüzden bir yıl değişmez olarak önbelleğe alınabilir.
const staticDir = join(out, '_next', 'static');
if (!existsSync(staticDir)) fail('out/_next/static bulunamadı');
writeFileSync(
  join(staticDir, '.htaccess'),
  [
    '# scripts/postbuild.mjs tarafından üretildi. Bu klasördeki dosya adları içerik özeti (hash) taşır.',
    '<IfModule mod_headers.c>',
    '  Header set Cache-Control "public, max-age=31536000, immutable"',
    '</IfModule>',
    '',
  ].join('\n'),
);

// HTML ve CSS içinde adı geçen her yerel dosya out/ içinde olmalı
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(out).filter((f) => /\.(html|css)$/.test(f));
const missing = new Set();
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(/["'(](\/(?:_next|icon)[^"')?\s\\]*)/g)) {
    if (!existsSync(join(out, m[1]))) missing.add(m[1]);
  }
}
if (missing.size) fail(`eksik dosyalar: ${[...missing].join(', ')}`);

console.log(`postbuild: out/ hazır (${walk(out).length} dosya)`);
