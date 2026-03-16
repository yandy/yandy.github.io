import { test, expect } from '@playwright/test';

test.describe('Mobile Article Content Visibility', () => {
  test('article content should be visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');

    const article = page.locator('article');
    await expect(article).toBeVisible();

    const prose = page.locator('.prose');
    await expect(prose).toBeVisible();

    const heading = page.locator('.prose h2').first();
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveCSS('display', 'none');
  });

  test('article should have non-zero dimensions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');

    const article = page.locator('article');
    const box = await article.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('mobile TOC toggle should not hide article content', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');

    const tocToggle = page.locator('#toc-toggle');
    if (await tocToggle.isVisible()) {
      await tocToggle.click();
    }

    const article = page.locator('article');
    await expect(article).toBeVisible();
  });
});
