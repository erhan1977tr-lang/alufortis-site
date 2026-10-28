import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  (page as unknown as { _errors: string[] })._errors = errors;
  await page.goto('/tr/');
});

const langs = (process.env.SITE_LANGS || 'tr').split(',').map((l) => l.trim());

test('ana başlık ve açılış filmi yükleniyor', async ({ page, isMobile }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Alüminyumda');
  await expect(page.locator('#top video')).toHaveCount(1);
  if (!isMobile) {
    // Masaüstünde film kaydırmaya bağlı: bütünüyle yüklenip hazır olmalı
    await expect(page.locator('#top .film-stage')).toHaveClass(/video-ready/, { timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, document.getElementById('top')!.offsetHeight * 0.5));
    await expect.poll(() => page.locator('#top video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(5);
  }
  expect((page as unknown as { _errors: string[] })._errors).toEqual([]);
});

test('tüm bölümler ve iletişim bilgileri mevcut', async ({ page }) => {
  for (const id of ['kurumsal', 'muhendislik', 'uretim', 'sektorler', 'kataloglar', 'iletisim']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator('a[href="mailto:info@alufortis.com"]')).toBeVisible();
  await expect(page.locator('a[href="tel:+905334184245"]')).toBeVisible();
});

test('üretim adımları kaydırınca etkinleşiyor', async ({ page }) => {
  await page.locator('#eloksal').scrollIntoViewIfNeeded();
  await page.locator('#eloksal').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(page.locator('#eloksal')).toHaveClass(/opacity-100/);
  await page.getByRole('radio', { name: 'Siyah' }).click();
  await expect(page.getByText('Siyah eloksal')).toBeVisible();
});

test('sayfa yatay taşma yapmıyor', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mobil menü açılıp kapanıyor', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'yalnızca mobil');
  await page.getByRole('button', { name: 'Menüyü aç' }).click();
  await page.locator('#mobil-menu').getByRole('link', { name: 'Üretim' }).click();
  await expect(page.locator('#mobil-menu')).toHaveCount(0);
});

test('adresle doğrudan açılan bölüm beklemeden gösteriliyor', async ({ page }) => {
  // CI makinesinde 3D sahne yazılımla çiziliyor; ilk açılışta sayfa bir süre meşgul kalabiliyor
  test.slow();
  await page.goto('about:blank');
  await page.goto('/tr/#uretim');
  await page.waitForTimeout(600);
  const top = await page.locator('#uretim').evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(top - 64)).toBeLessThan(24);
});

test('menüden bölüme yumuşak kaydırma korunuyor', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'masaüstü menüsü');
  await page.waitForTimeout(500);
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Kataloglar' }).click();
  const target = await page.locator('#kataloglar').evaluate((el) => el.getBoundingClientRect().top + scrollY - 64);
  await page.waitForTimeout(60);
  const mid = await page.evaluate(() => scrollY);
  expect(mid).toBeLessThan(target - 50);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 8000 }).toBeGreaterThan(target - 5);
  expect(page.url()).toContain('#kataloglar');
});

test('kök adres tarayıcı diline, yoksa Türkçeye yönleniyor', async ({ browser }) => {
  for (const [locale, want] of [
    ['tr-TR', 'tr'],
    ['de-DE', langs.includes('de') ? 'de' : 'tr'],
    ['fr-FR', 'tr'],
  ]) {
    const ctx = await browser.newContext({ locale });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(new RegExp(`/${want}/$`));
    await expect(page.locator('html')).toHaveAttribute('lang', want);
    await ctx.close();
  }
});

test('yayındaki diller açılıyor, diğerleri yok', async ({ page, request }) => {
  const titles: Record<string, string> = { tr: 'Alüminyumda', en: 'Precision in', de: 'Präzision in' };
  for (const l of ['tr', 'en', 'de']) {
    const res = await request.get(`/${l}/`);
    if (!langs.includes(l)) {
      expect(res.status()).toBe(404);
      continue;
    }
    await page.goto(`/${l}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', l);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(titles[l]);
    await expect(page.locator('body')).not.toContainText(/perpolio/i);
  }
});

test('dil seçici yalnızca birden çok dil varken görünüyor', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'masaüstü menüsü');
  const sw = page.getByRole('list', { name: 'Dil seçimi' });
  if (langs.length < 2) {
    await expect(sw).toHaveCount(0);
    return;
  }
  await sw.getByRole('link', { name: langs[1].toUpperCase() }).click();
  await expect(page).toHaveURL(new RegExp(`/${langs[1]}/$`));
});
