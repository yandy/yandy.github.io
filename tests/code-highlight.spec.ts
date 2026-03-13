import { test, expect } from '@playwright/test';

/**
 * Code Block Syntax Highlighting Tests
 *
 * These tests verify that code blocks have proper syntax highlighting
 * by checking that syntax highlighting CSS classes are present and
 * have the correct colors applied.
 */

test.describe('Code Block Syntax Highlighting', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to an article with code blocks
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    // Use domcontentloaded for Firefox compatibility
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should have syntax highlighting classes on code elements', async ({ page }) => {
    // Find code blocks
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    // Check that code elements have syntax highlighting classes
    const codeElements = page.locator('figure.highlight td.code pre span');
    const codeCount = await codeElements.count();

    expect(codeCount).toBeGreaterThan(0);

    // Check that at least some elements have syntax classes
    const elementsWithClasses = await codeElements.evaluateAll(els => {
      return els.filter(el => {
        const className = el.className;
        // Check for common syntax highlighting classes used by highlight.js
        const syntaxClasses = ['keyword', 'string', 'comment', 'number', 'function', 'variable', 'operator', 'built_in', 'literal'];
        return syntaxClasses.some(cls => className.includes(cls));
      }).length;
    });

    expect(elementsWithClasses).toBeGreaterThan(0);
  });

  test('should apply distinct colors to different syntax elements', async ({ page }) => {
    // Find code blocks
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    // Get all code spans and their computed colors
    const colors = await page.evaluate(() => {
      const spans = document.querySelectorAll('figure.highlight td.code pre span');
      const colorMap = new Map<string, string[]>();

      spans.forEach(span => {
        const className = span.className;
        if (!className) return;

        const computedColor = window.getComputedStyle(span).color;

        // Group by class name
        const classes = className.split(' ').filter(c => c);
        classes.forEach(cls => {
          if (!colorMap.has(cls)) {
            colorMap.set(cls, []);
          }
          const colors = colorMap.get(cls)!;
          if (!colors.includes(computedColor)) {
            colors.push(computedColor);
          }
        });
      });

      // Convert Map to object for return
      const result: Record<string, string[]> = {};
      colorMap.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    });

    // Check that we have some syntax highlighting classes with colors
    const syntaxClasses = ['string', 'comment', 'variable', 'built_in', 'literal', 'keyword', 'function'];
    const foundClasses = Object.keys(colors).filter(cls =>
      syntaxClasses.some(syntaxCls => cls.includes(syntaxCls))
    );

    expect(foundClasses.length).toBeGreaterThan(0);

    // Check that at least some classes have non-default colors (not black or inherited)
    const nonDefaultColors = Object.entries(colors).filter(([cls, colorList]) => {
      if (!syntaxClasses.some(syntaxCls => cls.includes(syntaxCls))) return false;
      // Check if any color is not the default (black or inherited)
      return colorList.some(color =>
        color !== 'rgb(0, 0, 0)' &&
        color !== 'rgba(0, 0, 0, 0)' &&
        color !== 'rgb(243, 244, 246)' // The default text color in dark mode
      );
    });

    expect(nonDefaultColors.length).toBeGreaterThan(0);
  });

  test('should have different colors for strings vs comments', async ({ page }) => {
    // Find code blocks
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    // Get colors for string and comment classes
    const colors = await page.evaluate(() => {
      const result: { strings: string[]; comments: string[] } = { strings: [], comments: [] };

      // Find string elements
      document.querySelectorAll('figure.highlight td.code pre .string').forEach(el => {
        const color = window.getComputedStyle(el).color;
        if (!result.strings.includes(color)) {
          result.strings.push(color);
        }
      });

      // Find comment elements
      document.querySelectorAll('figure.highlight td.code pre .comment').forEach(el => {
        const color = window.getComputedStyle(el).color;
        if (!result.comments.includes(color)) {
          result.comments.push(color);
        }
      });

      return result;
    });

    // If we have both strings and comments, they should have different colors
    if (colors.strings.length > 0 && colors.comments.length > 0) {
      const stringColors = new Set(colors.strings);
      const commentColors = new Set(colors.comments);

      // There should be at least one color that's different between strings and comments
      let hasDifferentColors = false;
      for (const strColor of stringColors) {
        if (!commentColors.has(strColor)) {
          hasDifferentColors = true;
          break;
        }
      }

      expect(hasDifferentColors).toBe(true);
    }
  });

  test('should not have default/inherited color for all syntax elements', async ({ page }) => {
    // Find code blocks
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    // Get the default text color
    const defaultColor = await page.evaluate(() => {
      const pre = document.querySelector('figure.highlight td.code pre');
      return pre ? window.getComputedStyle(pre).color : 'rgb(243, 244, 246)';
    });

    // Check that syntax elements have distinct colors from the default
    const syntaxElements = await page.locator('figure.highlight td.code pre span[class*="string"], figure.highlight td.code pre span[class*="comment"], figure.highlight td.code pre span[class*="keyword"]').all();

    let hasDistinctColor = false;
    for (const element of syntaxElements) {
      const color = await element.evaluate(el => window.getComputedStyle(el).color);
      if (color !== defaultColor) {
        hasDistinctColor = true;
        break;
      }
    }

    expect(hasDistinctColor).toBe(true);
  });
});
