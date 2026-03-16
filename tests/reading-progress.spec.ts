import { test, expect } from '@playwright/test';

test.describe('Reading Progress Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('progress bar should exist on article pages', async ({ page }) => {
    const progressBar = page.locator('#reading-progress');
    await expect(progressBar).toBeVisible();
  });

  test('progress bar should start at 0%', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const progressBar = page.locator('#reading-progress');
    const width = await progressBar.evaluate(el => (el as HTMLElement).style.width);
    
    expect(width).toBe('0%');
  });

  test('progress bar should increase when scrolling down', async ({ page }) => {
    const progressBar = page.locator('#reading-progress');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const initialWidth = await progressBar.evaluate(el => (el as HTMLElement).style.width);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    const midWidth = await progressBar.evaluate(el => (el as HTMLElement).style.width);

    const initialPercent = parseFloat(initialWidth);
    const midPercent = parseFloat(midWidth);

    expect(midPercent).toBeGreaterThan(initialPercent);
  });

  test('progress bar should reach near 100% at bottom', async ({ page }) => {
    const progressBar = page.locator('#reading-progress');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const width = await progressBar.evaluate(el => (el as HTMLElement).style.width);
    const percent = parseFloat(width);

    expect(percent).toBeGreaterThan(80);
  });

  test('progress bar should be fixed at top', async ({ page }) => {
    const progressBar = page.locator('#reading-progress');

    await expect(progressBar).toHaveCSS('position', 'fixed');
    await expect(progressBar).toHaveCSS('top', '0px');
    await expect(progressBar).toHaveCSS('left', '0px');
  });

  test('progress bar should have gradient background', async ({ page }) => {
    const progressBar = page.locator('#reading-progress');

    const background = await progressBar.evaluate(el => {
      return window.getComputedStyle(el).background;
    });

    expect(background).toContain('linear-gradient');
  });

  test('progress bar should not be visible on non-article pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const progressBar = page.locator('#reading-progress');
    await expect(progressBar).toBeHidden();
  });
});
