import { test, expect } from '@playwright/test';

test.describe('首页头部设计', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4000/');
  });

  test('首页应该有醒目的标题区域', async ({ page }) => {
    // 检查 hero 区域是否存在
    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();
    
    // 检查标题是否有视觉吸引力
    const title = hero.locator('.hero-title');
    await expect(title).toBeVisible();
  });

  test('首页标题应该有渐变效果', async ({ page }) => {
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toHaveCSS('background-clip', /text/);
  });

  test('首页副标题应该有适当的样式', async ({ page }) => {
    const subtitle = page.locator('.hero-subtitle');
    await expect(subtitle).toBeVisible();
  });
});

test.describe('Header 滚动遮挡', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4000/');
  });

  test('header 顶部应该有遮挡条', async ({ page }) => {
    const topBar = page.locator('.fixed.top-0.left-0.right-0.h-4');
    await expect(topBar).toBeVisible();
    await expect(topBar).toHaveCSS('position', 'fixed');
    await expect(topBar).toHaveCSS('z-index', '50');
  });

  test('滚动时遮挡条应该保持可见', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const topBar = page.locator('.fixed.top-0.left-0.right-0.h-4');
    await expect(topBar).toBeVisible();
  });

  test('header 应该有正确的定位和 z-index', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toHaveCSS('position', 'fixed');
    await expect(header).toHaveCSS('z-index', '50');
  });
});
