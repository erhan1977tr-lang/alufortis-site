// Build sonrası: hash'li dosyalar için önbellek kuralı ekler ve out/ klasörünü yayına uygunluk için denetler.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = 'out';
const fail = (msg) => {
  console.error(`postbuild: ${msg}`);
  process.exit(1);
};

// Kök adres (/) dil klasörüne yönlendirir. Yayındaki diller derlemede SITE_LANGS ile seçilir (varsayılan: tr).
const langs = readdirSync(out).filter((d) => ['tr', 'en', 'de'].includes(d) && existsSync(join(out, d, 'index.html')));
if (!langs.includes('tr')) fail('out/tr/index.html bulunamadı');
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Alufortis</title>
<meta http-equiv="refresh" content="0; url=./tr/">
<script>
  // Tarayıcı dili yayındaki dillerden biriyse ona, değilse Türkçeye git
  (function () {
    var langs = ${JSON.stringify(langs)};
    var pref = (navigator.languages || [navigator.language || '']).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
    var pick = pref.filter(function (l) { return langs.indexOf(l) > -1; })[0] || 'tr';
    location.replace('./' + pick + '/' + location.hash);
  })();
</script>
</head>
<body style="background:#07090c;color:#e3e6e9;font-family:system-ui,sans-serif">
<p><a href="./tr/" style="color:inherit">Alufortis</a></p>
</body>
</html>
`,
);
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
  for (const m of readFileSync(f, 'utf8').matchAll(/["'(](\/(?:_next|icon|gorseller)[^"')?\s\\]*)/g)) {
    if (!existsSync(join(out, decodeURIComponent(m[1])))) missing.add(m[1]);
  }
}
if (missing.size) fail(`eksik dosyalar: ${[...missing].join(', ')}`);

console.log(`postbuild: out/ hazır (${walk(out).length} dosya, diller: ${langs.join(', ')})`);
