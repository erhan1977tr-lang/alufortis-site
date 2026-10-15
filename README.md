# Alufortis web sitesi

Next.js 15 (statik export) + Tailwind CSS 4 + Three.js / React Three Fiber + GSAP + Playwright.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # statik site out/ klasörüne üretilir
npx playwright test   # masaüstü ve mobil tarayıcı testleri (önce build)
```

## Yayın

`main` dalına yapılan her gönderimde GitHub Actions siteyi derler, Playwright testlerini çalıştırır ve GitHub Pages'e yayınlar (`.github/workflows/deploy.yml`). Site **https://alufortis.gkh.ro** adresinde yayınlanır (`public/CNAME`).

`out/` klasörü başka bir statik barındırmaya da olduğu gibi yüklenebilir.

## Yapı

- `lib/content.ts`: sitedeki tüm metinler (eski alufortis.com içeriğinden alındı)
- `components/three/profile.ts`: 3D alüminyum profil kesiti ve kalıp geometrisi
- `components/Hero.tsx`: profilin kalıptan çıktığı açılış animasyonu
- `components/Production.tsx`: kaydırmayla ilerleyen üretim aşamaları ve eloksal renk seçici
- `tests/site.spec.ts`: Playwright testleri
