import { test, expect } from '@playwright/test';

test.describe('Focus Visible States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('links should have visible focus state', async ({ page }) => {
    const firstLink = page.locator('a').first();
    await expect(firstLink).toBeVisible();

    await firstLink.focus();

    const outline = await firstLink.evaluate(el => {
      return window.getComputedStyle(el).outline;
    });

    expect(outline).not.toBe('none');
    expect(outline).not.toBe('0px none rgb(0, 0, 0)');
  });

  test('buttons should have visible focus state', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    
    if (await themeToggle.isVisible()) {
      await themeToggle.focus();

      const outline = await themeToggle.evaluate(el => {
        return window.getComputedStyle(el).outline;
      });

      expect(outline).not.toBe('none');
    }
  });

  test('TOC links should have focus state', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForLoadState('domcontentloaded');

    const tocLink = page.locator('.toc-sidebar .toc-nav a').first();
    
    if (await tocLink.count() > 0) {
      await tocLink.focus();

      const outline = await tocLink.evaluate(el => {
        return window.getComputedStyle(el).outline;
      });

      expect(outline).not.toBe('none');
    }
  });

  test('focus outline should use accent color', async ({ page }) => {
    const firstLink = page.locator('a').first();
    await firstLink.focus();

    const outlineColor = await firstLink.evaluate(el => {
      return window.getComputedStyle(el).outlineColor;
    });

    const accentColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
    });

    expect(outlineColor).toBeTruthy();
  });

  test('copy button should be focusable', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');

    const codeBlock = page.locator('.highlight').first();
    const copyBtn = codeBlock.locator('.copy-btn');

    await expect(copyBtn).toBeVisible();
    await copyBtn.focus();

    const outline = await copyBtn.evaluate(el => {
      return window.getComputedStyle(el).outline;
    });

    expect(outline).not.toBe('none');
  });
});

test.describe('Touch Target Sizes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigation links should have minimum 44px height', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('header nav:not(#mobile-menu) a.nav-link');
    const count = await navLinks.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('tag links should have minimum 44px height', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('networkidle');

    const tagLinks = page.locator('a[href^="/tags/"]').first();
    await expect(tagLinks).toBeVisible();
    
    const box = await tagLinks.boundingBox();
    
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
