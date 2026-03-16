import { test, expect } from '@playwright/test';

test.describe('Mobile TOC Toggle', () => {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 }
  };

  test('mobile should show TOC toggle button', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    await expect(tocToggle).toBeVisible();
    await expect(tocToggle).toContainText('目录');
  });

  test('tablet should show TOC toggle button', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    await expect(tocToggle).toBeVisible();
  });

  test('desktop should not show TOC toggle button', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    await expect(tocToggle).toBeHidden();
  });

  test('clicking toggle should show TOC content', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    const tocContent = page.locator('#toc-mobile');
    const tocIcon = page.locator('#toc-icon');

    await expect(tocContent).toBeHidden();
    await expect(tocIcon).not.toHaveCSS('transform', /rotate/);

    await tocToggle.click();

    await expect(tocContent).toBeVisible();
    // Check that transform is applied (either rotate or matrix representation)
    const transformValue = await tocIcon.evaluate(el => getComputedStyle(el).transform);
    expect(transformValue).not.toBe('none');
    expect(transformValue).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
  });

  test('clicking toggle again should hide TOC content', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    const tocContent = page.locator('#toc-mobile');

    await tocToggle.click();
    await expect(tocContent).toBeVisible();

    await tocToggle.click();
    await expect(tocContent).toBeHidden();
  });

  test('clicking TOC link should hide mobile TOC', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    const tocContent = page.locator('#toc-mobile');

    await tocToggle.click();
    await expect(tocContent).toBeVisible();

    const tocLink = tocContent.locator('a').first();
    if (await tocLink.count() > 0) {
      await tocLink.click();
      await expect(tocContent).toBeHidden();
    }
  });

  test('mobile TOC should have correct styling', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');

    const tocToggle = page.locator('#toc-toggle');
    
    await expect(tocToggle).toHaveCSS('border-radius', '12px');
    await expect(tocToggle).toHaveCSS('background-color', /rgba\(/);
  });
});
