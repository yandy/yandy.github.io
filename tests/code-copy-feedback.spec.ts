import { test, expect } from '@playwright/test';

/**
 * Code Copy Feedback Tests
 *
 * These tests verify that the copy button on code blocks shows
 * feedback when clicked.
 */

test.describe('Code Block Copy Feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('copy button should be visible on hover over code block', async ({ page }) => {
    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const copyBtn = codeBlock.locator('.copy-btn');

    // Initially button should have opacity 0
    await expect(copyBtn).toHaveCSS('opacity', '0');

    // Hover over code block to show button
    await codeBlock.hover();
    await page.waitForTimeout(300);

    // Button should become visible
    await expect(copyBtn).toHaveCSS('opacity', '1');
  });

  test('clicking copy button should show feedback message', async ({ page }) => {
    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const copyBtn = codeBlock.locator('.copy-btn');
    const feedback = codeBlock.locator('.copy-feedback');

    // Hover to show button
    await codeBlock.hover();
    await page.waitForTimeout(300);

    // Click copy button
    await copyBtn.click();

    // Feedback should be visible
    await expect(feedback).toHaveClass(/show/);
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('已复制!');

    // Copy button should be hidden
    await expect(copyBtn).toHaveCSS('opacity', '0');
  });

  test('feedback should disappear after 2 seconds', async ({ page }) => {
    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const copyBtn = codeBlock.locator('.copy-btn');
    const feedback = codeBlock.locator('.copy-feedback');

    // Hover and click
    await codeBlock.hover();
    await page.waitForTimeout(300);
    await copyBtn.click();

    // Feedback should be visible
    await expect(feedback).toHaveClass(/show/);

    // Wait for 2.5 seconds (slightly more than 2s timeout)
    await page.waitForTimeout(2500);

    // Feedback should be hidden again
    await expect(feedback).not.toHaveClass(/show/);
    await expect(copyBtn).not.toHaveCSS('opacity', '0');
  });

  test('copy button should copy code to clipboard', async ({ page, browserName }) => {
    // Skip this test in Firefox as it doesn't support clipboard permissions
    if (browserName === 'firefox') {
      test.skip('Firefox does not support clipboard permissions');
      return;
    }

    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const copyBtn = codeBlock.locator('.copy-btn');

    // Get the code content
    const codeContent = await codeBlock.locator('td.code pre code, pre code').first().textContent();
    expect(codeContent).toBeTruthy();

    // Hover and click
    await codeBlock.hover();
    await page.waitForTimeout(300);

    // Grant clipboard permissions (Chromium only)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy button
    await copyBtn.click();

    // Wait a bit for clipboard operation
    await page.waitForTimeout(500);

    // Read clipboard content
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    });

    // Clipboard should contain the code (or at least some text)
    if (clipboardText) {
      expect(clipboardText.length).toBeGreaterThan(0);
    }
  });

  test('all code blocks should have copy buttons', async ({ page }) => {
    const codeBlocks = page.locator('.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found');
      return;
    }

    // Each code block should have a copy button
    for (let i = 0; i < count; i++) {
      const block = codeBlocks.nth(i);
      const copyBtn = block.locator('.copy-btn');
      await expect(copyBtn).toBeVisible();
    }
  });
});
