import { test, expect } from '@playwright/test';

test.describe('Skip Link Functionality', () => {
  test('should have skip link in header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const skipLink = page.locator('a[href="#main-content"].skip-link');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toContainText('跳转到主要内容');
  });

  test('skip link should be the first focusable element', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.keyboard.press('Tab');

    const activeElement = await page.evaluate(() => {
      return document.activeElement?.getAttribute('href');
    });

    expect(activeElement).toBe('#main-content');
  });

  test('skip link should move focus to main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const skipLink = page.locator('a[href="#main-content"].skip-link');
    await skipLink.focus();
    await skipLink.click();

    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeVisible();

    const activeElementId = await page.evaluate(() => {
      return document.activeElement?.id;
    });

    expect(activeElementId).toBe('main-content');
  });

  test('main content should have tabindex for focus management', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mainContent = page.locator('main#main-content');
    const tabindex = await mainContent.getAttribute('tabindex');

    expect(tabindex).toBe('-1');
  });
});

test.describe('Reduced Motion Support', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const animationDuration = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section');
      if (hero) {
        return window.getComputedStyle(hero).animationDuration;
      }
      return null;
    });

    if (animationDuration) {
      expect(['0s', '0.001s', '1ms']).toContain(animationDuration);
    }
  });

  test('scroll behavior should work with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.setViewportSize({ width: 1280, height: 800 });

    const tocLink = page.locator('.toc-sidebar .toc-nav a').first();
    
    if (await tocLink.count() > 0) {
      await tocLink.click();
    }
  });
});

test.describe('Mobile Theme Toggle', () => {
  test('mobile theme toggle button should exist', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('domcontentloaded');

    const hamburgerButton = page.locator('#mobile-menu-toggle');
    await hamburgerButton.click();

    const mobileThemeToggle = page.locator('#theme-toggle-mobile');
    await expect(mobileThemeToggle).toBeVisible();
  });

  test('mobile theme toggle should change theme', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('domcontentloaded');

    const hamburgerButton = page.locator('#mobile-menu-toggle');
    await hamburgerButton.click();

    const mobileThemeToggle = page.locator('#theme-toggle-mobile');
    
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    await mobileThemeToggle.click();

    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Interactive Element Cursors', () => {
  test('article cards should have cursor pointer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const article = page.locator('article').first();
    const cursor = await article.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });

    expect(cursor).toBe('pointer');
  });

  test('tags should have cursor pointer', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');

    const tagLink = page.locator('a[href^="/tags/"]').first();
    
    if (await tagLink.isVisible()) {
      const cursor = await tagLink.evaluate(el => {
        return window.getComputedStyle(el).cursor;
      });

      expect(cursor).toBe('pointer');
    }
  });
});
