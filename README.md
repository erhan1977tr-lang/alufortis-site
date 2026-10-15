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
- Yalnızca `main` dalında ve testler geçtikten sonra `out/` içeriğini GreenGeeks'e yükler. Yükleme yalnızca `public_html/alufortis.gkh.ro` dizinini değiştirir.
- Yöntem `DEPLOY_METHOD` depo değişkeniyle seçilir: `ssh` (varsayılan, SSH + rsync) ya da `ftps`.

Gerekli GitHub Secrets (Settings > Secrets and variables > Actions):

| Yöntem | Secret | Açıklama |
|---|---|---|
| ssh | `GG_SSH_HOST` | GreenGeeks sunucu adı |
| ssh | `GG_SSH_PORT` | SSH portu (boşsa 22) |
| ssh | `GG_SSH_USER` | cPanel kullanıcı adı |
| ssh | `GG_SSH_KEY` | Yalnızca bu iş için oluşturulan özel SSH anahtarı |
| ssh | `GG_SSH_KNOWN_HOSTS` | `ssh-keyscan -p PORT HOST` çıktısı (sunucu doğrulaması) |
| ftps | `GG_FTP_HOST`, `GG_FTP_USER`, `GG_FTP_PASSWORD` | Yalnızca `public_html/alufortis.gkh.ro` dizinine erişebilen FTP hesabı |

`.htaccess` (`public/.htaccess` ve build sonrası üretilen `out/_next/static/.htaccess`):

- 404 için Next.js'in `404.html` sayfasını gösterir.
- HTTP isteklerini HTTPS'e yönlendirir.
- Yalnızca adı hash içeren `_next/static/` dosyalarını bir yıl boyunca önbelleğe alır. HTML ve diğer dosyalar her istekte doğrulanır.

Elle yüklemek için: `npm ci && npm run build`, ardından `out/` klasörünün **içeriğini** (gizli `.htaccess` dosyaları dahil) `public_html/alufortis.gkh.ro/` dizinine yükleyin.

## Yapı

- `lib/content.ts`: sitedeki tüm metinler (eski alufortis.com içeriğinden alındı)
- `components/three/profile.ts`: 3D alüminyum profil kesiti ve kalıp geometrisi
- `components/Hero.tsx`: profilin kalıptan çıktığı açılış animasyonu
- `components/Production.tsx`: kaydırmayla ilerleyen üretim aşamaları ve eloksal renk seçici
- `tests/site.spec.ts`: Playwright testleri
