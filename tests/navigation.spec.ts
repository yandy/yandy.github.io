import { test, expect } from '@playwright/test';

/**
 * Internal Link Navigation Tests
 * 
 * These tests verify that all internal links on the site work correctly,
 * including navigation menu links, article links, and pagination.
 */

test.describe('Internal Link Navigation', () => {
  
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/神奇小龟/);
  });

  test('should navigate to archives page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/archives"]');
    await expect(page).toHaveURL(/\/archives/);
    await expect(page.locator('h1')).toContainText('归档');
  });

  test('should navigate to categories page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/categories"]');
    await expect(page).toHaveURL(/\/categories/);
    await expect(page.locator('h1')).toContainText('分类');
  });

  test('should navigate to tags page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/tags"]');
    await expect(page).toHaveURL(/\/tags/);
    await expect(page.locator('h1')).toContainText('标签');
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/\/about/);
  });

  test('should navigate to an article from home page', async ({ page }) => {
    await page.goto('/');
    // Find the first article link and click it
    const articleLink = page.locator('article a').first();
    await expect(articleLink).toBeVisible();
    await articleLink.click();
    // Should navigate to a post page
    await expect(page).toHaveURL(/\d{4}\/\d{2}\/\d{2}/);
  });

  test('should navigate through pagination', async ({ page }) => {
    await page.goto('/');
    
    // Check if pagination exists (if there are multiple pages)
    const nextPageLink = page.locator('a:has-text("下一页")');
    if (await nextPageLink.isVisible().catch(() => false)) {
      await nextPageLink.click();
      await expect(page).toHaveURL(/\/page\/\d+/);
    }
  });

  test('should have working tag links on article pages', async ({ page }) => {
    // Navigate to a post page
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    
    // Find and click a tag link
    const tagLink = page.locator('a[href^="/tags/"]').first();
    if (await tagLink.isVisible().catch(() => false)) {
      await tagLink.click();
      await expect(page).toHaveURL(/\/tags\//);
    }
  });
});
