# Alufortis web sitesi

Next.js 15 (statik export) + Tailwind CSS 4 + Three.js / React Three Fiber + GSAP + Playwright.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # statik site out/ klasörüne üretilir
npx playwright test   # masaüstü ve mobil tarayıcı testleri (önce build)
```

## Yayın (GreenGeeks)

Site **https://alufortis.gkh.ro** adresinde, GreenGeeks'te `public_html/alufortis.gkh.ro` dizininden statik olarak yayınlanır.

`.github/workflows/deploy.yml`:

- Her PR'da ve `main` dalında siteyi derler (`npm run build`) ve Playwright testlerini çalıştırır.
- Yalnızca `main` dalında ve testler geçtikten sonra `out/` içeriğini **FTPS** ile yükler. Bağlantı port 21 üzerinden explicit TLS ile kurulur ve TLS sertifikası doğrulanır (`security: strict`).
- FTP hesabının kökü `public_html/alufortis.gkh.ro` olduğu için yükleme hedefi `/` dizinidir. Hesap başka dizinlere erişemez.
- Silme işlemi yalnızca bu iş akışının daha önce yüklediği ve yeni build'de artık bulunmayan dosyaları kapsar. Bu dosyalar `.ftp-deploy-sync-state.json` ile izlenir. `.well-known`, `cgi-bin` ve `.user.ini` ayrıca korunur.
- Yükleme başarısız olursa iş akışı da başarısız olur.
- **Kuru çalıştırma:** Actions sekmesinde "Run workflow" seçilip "kuru çalıştırma" işaretli bırakılırsa iş akışı sunucuya bağlanır ve yapılacak değişiklikleri listeler, hiçbir dosyayı değiştirmez.

Gerekli GitHub Repository Secrets: `GG_FTP_SERVER`, `GG_FTP_USERNAME`, `GG_FTP_PASSWORD`.

`.htaccess` (`public/.htaccess` ve build sonrası üretilen `out/_next/static/.htaccess`):

- 404 için Next.js'in `404.html` sayfasını gösterir.
- HTTP isteklerini HTTPS'e yönlendirir.
- Yalnızca adı hash içeren `_next/static/` dosyalarını bir yıl boyunca önbelleğe alır. HTML ve diğer dosyalar her istekte doğrulanır.
- FTPS durum dosyasının dışarıdan okunmasını engeller.

Elle yüklemek için: `npm ci && npm run build`, ardından `out/` klasörünün **içeriğini** (gizli `.htaccess` dosyaları dahil) `public_html/alufortis.gkh.ro/` dizinine yükleyin.

## Yapı

- `lib/content.ts`: sitedeki tüm metinler (eski alufortis.com içeriğinden alındı)
- `components/three/profile.ts`: 3D alüminyum profil kesiti ve kalıp geometrisi
- `components/Hero.tsx`: profilin kalıptan çıktığı açılış animasyonu
- `components/Production.tsx`: kaydırmayla ilerleyen üretim aşamaları ve eloksal renk seçici
- `tests/site.spec.ts`: Playwright testleri
