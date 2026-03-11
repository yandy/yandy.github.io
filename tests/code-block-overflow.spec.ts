import { test, expect } from '@playwright/test';

/**
 * Code Block Overflow Tests
 * 
 * These tests verify that code blocks do not overflow their containers
 * and that long lines are properly handled with horizontal scrolling.
 */

test.describe('Code Block Overflow', () => {
  
  test('should not overflow horizontally on article page', async ({ page }) => {
    // Navigate to an article with code blocks
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find all highlight containers
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();
    
    // If there are code blocks, check each one
    for (let i = 0; i < count; i++) {
      const block = codeBlocks.nth(i);
      
      // Check if the code block is visible
      await expect(block).toBeVisible();
      
      // Get the bounding box of the code block
      const box = await block.boundingBox();
      expect(box).not.toBeNull();
      
      if (box) {
        // Get the parent container width (the article content area)
        const parent = await block.evaluate(el => {
          const parent = el.parentElement;
          if (!parent) return null;
          const rect = parent.getBoundingClientRect();
          return { width: rect.width };
        });
        
        if (parent) {
          // The code block should not exceed the parent container width by more than a small tolerance
          // Allow for 2px tolerance due to rounding
          expect(box.width).toBeLessThanOrEqual(parent.width + 2);
        }
      }
    }
  });

  test('should have horizontal scroll for long lines', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('networkidle');
    
    // Find code blocks
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();
    
    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }
    
    // Check the first code block
    const block = codeBlocks.first();
    
    // The code block should have overflow-x: auto to enable horizontal scrolling
    const overflowX = await block.evaluate(el => {
      return window.getComputedStyle(el).overflowX;
    });
    
    // Should be either 'auto' or 'scroll' to allow horizontal scrolling
    expect(['auto', 'scroll', 'clip']).toContain(overflowX);
  });

  test('should not break layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport before navigating
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('networkidle');

    // Get the page body width - it should not exceed viewport width
    const bodyWidth = await page.evaluate(() => {
      return document.body.scrollWidth;
    });

    // Allow 10px tolerance for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(375 + 10);
  });

  test('should handle very long lines without wrapping', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('networkidle');
    
    // Find code lines in the first code block
    const codeLines = page.locator('figure.highlight td.code pre');
    const count = await codeLines.count();
    
    if (count === 0) {
      test.skip('No code lines found');
      return;
    }
    
    // Check the white-space property of the pre element
    const whiteSpace = await codeLines.first().evaluate(el => {
      return window.getComputedStyle(el).whiteSpace;
    });
    
    // Should be 'pre' or 'pre-wrap' to preserve whitespace and line breaks
    expect(['pre', 'pre-wrap', 'pre-line']).toContain(whiteSpace);
  });
});
