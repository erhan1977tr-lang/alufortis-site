import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  (page as unknown as { _errors: string[] })._errors = errors;
  await page.goto('/');
});

test('ana başlık ve 3D sahne yükleniyor', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kalite ve');
  await expect(page.locator('#top canvas')).toBeVisible();
  expect((page as unknown as { _errors: string[] })._errors).toEqual([]);
});

test('tüm bölümler ve iletişim bilgileri mevcut', async ({ page }) => {
  for (const id of ['kurumsal', 'uretim', 'kataloglar', 'iletisim']) {
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
