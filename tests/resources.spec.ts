import { test, expect } from '@playwright/test';

/**
 * Resource Loading Tests
 * 
 * These tests verify that all static resources (images, CSS, JavaScript)
 * load correctly without 404 errors.
 */

test.describe('Resource Loading', () => {
  
  test('should load all CSS resources', async ({ page }) => {
    const cssRequests: string[] = [];
    const failedRequests: string[] = [];
    
    // Listen for all network requests
    page.on('request', request => {
      if (request.resourceType() === 'stylesheet') {
        cssRequests.push(request.url());
      }
    });
    
    page.on('requestfailed', request => {
      if (request.resourceType() === 'stylesheet') {
        failedRequests.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for failed CSS requests
    expect(failedRequests, `Failed CSS requests: ${failedRequests.join(', ')}`).toHaveLength(0);
    
    // At least one CSS file should be loaded (Tailwind from CDN)
    expect(cssRequests.length).toBeGreaterThan(0);
  });

  test('should load all JavaScript resources', async ({ page }) => {
    const jsRequests: string[] = [];
    const failedRequests: string[] = [];
    
    page.on('request', request => {
      if (request.resourceType() === 'script') {
        jsRequests.push(request.url());
      }
    });
    
    page.on('requestfailed', request => {
      if (request.resourceType() === 'script') {
        failedRequests.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(failedRequests, `Failed JS requests: ${failedRequests.join(', ')}`).toHaveLength(0);
  });

  test('should load all images without 404 errors', async ({ page }) => {
    const failedImages: string[] = [];
    
    page.on('requestfailed', request => {
      if (request.resourceType() === 'image') {
        failedImages.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(failedImages, `Failed images: ${failedImages.join(', ')}`).toHaveLength(0);
  });

  test('should load favicon', async ({ page, request }) => {
    await page.goto('/');
    
    // Check if favicon link exists
    const faviconLink = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    const count = await faviconLink.count();
    
    if (count > 0) {
      const href = await faviconLink.first().getAttribute('href');
      if (href) {
        // Try to fetch the favicon
        const response = await request.get(href);
        expect(response.status()).toBe(200);
      }
    }
  });

  test('should not have any 404 errors on home page', async ({ page }) => {
    const errorUrls: string[] = [];
    
    page.on('response', response => {
      if (response.status() === 404) {
        errorUrls.push(response.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(errorUrls, `404 errors found: ${errorUrls.join(', ')}`).toHaveLength(0);
  });

  test('should load RSS feed', async ({ page }) => {
    await page.goto('/');
    
    // Check if RSS link exists
    const rssLink = page.locator('link[type="application/atom+xml"], link[type="application/rss+xml"]');
    const count = await rssLink.count();
    
    // RSS is optional, but if it exists, it should work
    if (count > 0) {
      const href = await rssLink.first().getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});
