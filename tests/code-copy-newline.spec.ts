import { test, expect } from '@playwright/test';

test.describe('Code Block Copy Newline Preservation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('copied code should contain newlines for multi-line code blocks', async ({ page, browserName }) => {
    if (browserName === 'firefox') {
      test.skip('Firefox does not support clipboard permissions');
    }

    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const copyBtn = codeBlock.locator('.copy-btn');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await codeBlock.hover();
    await page.waitForTimeout(300);
    await copyBtn.click();
    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    });

    expect(clipboardText).not.toBeNull();
    expect(clipboardText).toContain('\n');

    const newlineCount = (clipboardText?.match(/\n/g) || []).length;
    expect(newlineCount).toBeGreaterThan(0);
  });

  test('copied code should match original HTML structure after br-to-newline conversion', async ({ page, browserName }) => {
    if (browserName === 'firefox') {
      test.skip('Firefox does not support clipboard permissions');
    }

    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const codeElement = codeBlock.locator('td.code pre, pre code').first();

    const htmlWithNewlines = await codeElement.evaluate((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
      return clone.textContent || '';
    });

    const copyBtn = codeBlock.locator('.copy-btn');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await codeBlock.hover();
    await page.waitForTimeout(300);
    await copyBtn.click();
    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    });

    expect(clipboardText).toBe(htmlWithNewlines);
  });
});
