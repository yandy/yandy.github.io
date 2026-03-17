import { test, expect } from '@playwright/test';

/**
 * Code Block Tests
 *
 * Tests for code blocks including:
 * - Header with language label, collapse, copy, fullscreen buttons
 * - Syntax highlighting
 * - Copy functionality with feedback
 * - Tooltips
 * - Overflow handling
 * - Theme support
 */

test.describe('Code Block Header', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should have header on all code blocks', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    for (let i = 0; i < count; i++) {
      const header = codeBlocks.nth(i).locator('.code-header');
      await expect(header).toBeVisible();
    }
  });

  test('should display language label on the left side', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const langLabel = firstBlock.locator('.code-header .lang-label');
    await expect(langLabel).toBeVisible();

    const labelText = await langLabel.textContent();
    expect(labelText).toBeTruthy();
    expect(labelText).not.toBe('code');
    expect(labelText).not.toBe('');

    const header = firstBlock.locator('.code-header');
    const langBox = await langLabel.boundingBox();
    const headerBox = await header.boundingBox();

    expect(langBox).not.toBeNull();
    expect(headerBox).not.toBeNull();

    if (langBox && headerBox) {
      expect(langBox.x).toBeGreaterThanOrEqual(headerBox.x);
      expect(langBox.x).toBeLessThan(headerBox.x + headerBox.width / 2);
    }
  });

  test('should have collapse/expand button with icon', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const collapseBtn = firstBlock.locator('.code-header .collapse-btn');
    await expect(collapseBtn).toBeVisible();

    const svg = collapseBtn.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('should collapse and expand code block on button click', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const collapseBtn = firstBlock.locator('.code-header .collapse-btn');

    await expect(firstBlock).not.toHaveClass(/collapsed/);

    await collapseBtn.click();
    await expect(firstBlock).toHaveClass(/collapsed/);
    await expect(collapseBtn).toHaveClass(/collapsed/);

    await collapseBtn.click();
    await expect(firstBlock).not.toHaveClass(/collapsed/);
    await expect(collapseBtn).not.toHaveClass(/collapsed/);
  });

  test('should have copy button with icon on the right side', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const copyBtn = firstBlock.locator('.code-header .copy-btn');
    await expect(copyBtn).toBeVisible();

    const svg = copyBtn.locator('svg');
    await expect(svg).toBeVisible();

    const header = firstBlock.locator('.code-header');
    const btnBox = await copyBtn.boundingBox();
    const headerBox = await header.boundingBox();

    expect(btnBox).not.toBeNull();
    expect(headerBox).not.toBeNull();

    if (btnBox && headerBox) {
      expect(btnBox.x + btnBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width + 5);
      expect(btnBox.x).toBeGreaterThan(headerBox.x + headerBox.width / 2);
    }
  });

  test('should have fullscreen button with icon', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const fullscreenBtn = firstBlock.locator('.code-header .fullscreen-btn');
    await expect(fullscreenBtn).toBeVisible();

    const svg = fullscreenBtn.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('should enter and exit fullscreen mode', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const fullscreenBtn = firstBlock.locator('.code-header .fullscreen-btn');

    await fullscreenBtn.click();
    await expect(firstBlock).toHaveClass(/fullscreen/);

    await fullscreenBtn.click();
    await expect(firstBlock).not.toHaveClass(/fullscreen/);
  });

  test('should exit fullscreen with escape key', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const fullscreenBtn = firstBlock.locator('.code-header .fullscreen-btn');

    await fullscreenBtn.click();
    await expect(firstBlock).toHaveClass(/fullscreen/);

    await page.keyboard.press('Escape');
    await expect(firstBlock).not.toHaveClass(/fullscreen/);
  });

  test('should wrap code content in highlight-content div', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const content = firstBlock.locator('.highlight-content');
    await expect(content).toBeVisible();
  });

  test('should have proper header styling', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const header = firstBlock.locator('.code-header');

    const headerStyles = await header.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        padding: computed.padding,
        backgroundColor: computed.backgroundColor
      };
    });

    expect(headerStyles.display).toBe('flex');
    expect(headerStyles.justifyContent).toBe('space-between');
    expect(headerStyles.alignItems).toBe('center');
    expect(headerStyles.padding).not.toBe('0px');
    expect(headerStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('Code Block Tooltips', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should show tooltip on copy button hover', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    if (await codeBlocks.count() === 0) {
      test.skip('No code blocks found');
      return;
    }

    const firstBlock = codeBlocks.first();
    const copyBtn = firstBlock.locator('.code-header .copy-btn');

    const tooltipAttr = await copyBtn.getAttribute('data-tooltip');
    expect(tooltipAttr).toBe('复制');

    await copyBtn.hover();
    await page.waitForTimeout(300);

    const tooltipOpacity = await copyBtn.evaluate(el => {
      const afterStyle = window.getComputedStyle(el, '::after');
      return afterStyle.opacity;
    });
    expect(tooltipOpacity).toBe('1');
  });

  test('should show tooltip on fullscreen button hover', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    if (await codeBlocks.count() === 0) {
      test.skip('No code blocks found');
      return;
    }

    const firstBlock = codeBlocks.first();
    const fullscreenBtn = firstBlock.locator('.code-header .fullscreen-btn');

    await fullscreenBtn.hover();
    await page.waitForTimeout(300);

    const tooltipAttr = await fullscreenBtn.getAttribute('data-tooltip');
    expect(tooltipAttr).toBe('全屏');
  });

  test('should show tooltip on collapse button hover', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    if (await codeBlocks.count() === 0) {
      test.skip('No code blocks found');
      return;
    }

    const firstBlock = codeBlocks.first();
    const collapseBtn = firstBlock.locator('.code-header .collapse-btn');

    await collapseBtn.hover();
    await page.waitForTimeout(300);

    const tooltipAttr = await collapseBtn.getAttribute('data-tooltip');
    expect(tooltipAttr).toBe('折叠/展开');
  });
});

test.describe('Code Block Copy Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('copy button should be visible by default', async ({ page }) => {
    const codeBlock = page.locator('.highlight').first();
    await expect(codeBlock).toBeVisible();

    const copyBtn = codeBlock.locator('.copy-btn');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveCSS('opacity', '1');
  });

  test('should copy code when clicking copy button', async ({ page, context, browserName }) => {
    if (browserName === 'firefox') {
      test.skip('Firefox does not support clipboard permissions');
    }
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const copyBtn = firstBlock.locator('.code-header .copy-btn');

    await copyBtn.click();
    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.trim().length).toBeGreaterThan(0);
  });

  test('should copy correct code content without line numbers', async ({ page, context, browserName }) => {
    if (browserName === 'firefox') {
      test.skip('Firefox does not support clipboard permissions');
    }
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const codeBlocks = page.locator('figure.highlight');
    if (await codeBlocks.count() === 0) {
      test.skip('No code blocks found');
      return;
    }

    const firstBlock = codeBlocks.first();

    const codeElement = firstBlock.locator('td.code pre').first();
    const expectedCode = await codeElement.textContent();
    expect(expectedCode).toBeTruthy();
    expect(expectedCode!.length).toBeGreaterThan(0);

    const copyBtn = firstBlock.locator('.code-header .copy-btn');
    await copyBtn.click();
    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    expect(clipboardText.length).toBeGreaterThan(0);
    expect(clipboardText).toContain('$env:RUSTUP_DIST_SERVER=');
    expect(clipboardText).toContain('https://rsproxy.cn');

    const lineNumberPattern = /^\s*\d+\s*$/m;
    const isOnlyLineNumbers = clipboardText.split('\n').every(line =>
      line.trim().length === 0 || lineNumberPattern.test(line)
    );
    expect(isOnlyLineNumbers).toBe(false);

    expect(clipboardText).not.toMatch(/^\s*\d+\s*$/m);
  });

  test('copied code should preserve newlines for multi-line blocks', async ({ page, context, browserName }) => {
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

  test('should show copy feedback message', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const copyBtn = firstBlock.locator('.code-header .copy-btn');
    const feedback = firstBlock.locator('.copy-feedback');

    await expect(feedback).not.toHaveClass(/show/);

    await copyBtn.click();

    await expect(feedback).toHaveClass(/show/);
    await expect(feedback).toHaveText('已复制!');
  });

  test('copy feedback should disappear after 2 seconds', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const firstBlock = codeBlocks.first();
    const copyBtn = firstBlock.locator('.code-header .copy-btn');
    const feedback = firstBlock.locator('.copy-feedback');

    await copyBtn.click();
    await expect(feedback).toHaveClass(/show/);

    await page.waitForTimeout(2100);
    await expect(feedback).not.toHaveClass(/show/);
  });

  test('all code blocks should have copy buttons', async ({ page }) => {
    const codeBlocks = page.locator('.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found');
      return;
    }

    for (let i = 0; i < count; i++) {
      const block = codeBlocks.nth(i);
      const copyBtn = block.locator('.copy-btn');
      await expect(copyBtn).toBeVisible();
    }
  });
});

test.describe('Code Block Syntax Highlighting', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should have syntax highlighting classes on code elements', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const codeElements = page.locator('figure.highlight td.code pre span');
    const codeCount = await codeElements.count();

    expect(codeCount).toBeGreaterThan(0);

    const elementsWithClasses = await codeElements.evaluateAll(els => {
      return els.filter(el => {
        const className = el.className;
        const syntaxClasses = ['keyword', 'string', 'comment', 'number', 'function', 'variable', 'operator', 'built_in', 'literal'];
        return syntaxClasses.some(cls => className.includes(cls));
      }).length;
    });

    expect(elementsWithClasses).toBeGreaterThan(0);
  });

  test('should apply distinct colors to different syntax elements', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const colors = await page.evaluate(() => {
      const spans = document.querySelectorAll('figure.highlight td.code pre span');
      const colorMap = new Map<string, string[]>();

      spans.forEach(span => {
        const className = span.className;
        if (!className) return;

        const computedColor = window.getComputedStyle(span).color;
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

      const result: Record<string, string[]> = {};
      colorMap.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    });

    const syntaxClasses = ['string', 'comment', 'variable', 'built_in', 'literal', 'keyword', 'function'];
    const foundClasses = Object.keys(colors).filter(cls =>
      syntaxClasses.some(syntaxCls => cls.includes(syntaxCls))
    );

    expect(foundClasses.length).toBeGreaterThan(0);

    const nonDefaultColors = Object.entries(colors).filter(([cls, colorList]) => {
      if (!syntaxClasses.some(syntaxCls => cls.includes(syntaxCls))) return false;
      return colorList.some(color =>
        color !== 'rgb(0, 0, 0)' &&
        color !== 'rgba(0, 0, 0, 0)' &&
        color !== 'rgb(243, 244, 246)'
      );
    });

    expect(nonDefaultColors.length).toBeGreaterThan(0);
  });

  test('should have different colors for strings vs comments', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const colors = await page.evaluate(() => {
      const result: { strings: string[]; comments: string[] } = { strings: [], comments: [] };

      document.querySelectorAll('figure.highlight td.code pre .string').forEach(el => {
        const color = window.getComputedStyle(el).color;
        if (!result.strings.includes(color)) {
          result.strings.push(color);
        }
      });

      document.querySelectorAll('figure.highlight td.code pre .comment').forEach(el => {
        const color = window.getComputedStyle(el).color;
        if (!result.comments.includes(color)) {
          result.comments.push(color);
        }
      });

      return result;
    });

    if (colors.strings.length > 0 && colors.comments.length > 0) {
      const stringColors = new Set(colors.strings);
      const commentColors = new Set(colors.comments);

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
});

test.describe('Code Block Overflow and Layout', () => {

  test('should not overflow horizontally', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    for (let i = 0; i < count; i++) {
      const block = codeBlocks.nth(i);
      await expect(block).toBeVisible();

      const box = await block.boundingBox();
      expect(box).not.toBeNull();

      if (box) {
        const parent = await block.evaluate(el => {
          const parent = el.parentElement;
          if (!parent) return null;
          const rect = parent.getBoundingClientRect();
          return { width: rect.width };
        });

        if (parent) {
          expect(box.width).toBeLessThanOrEqual(parent.width + 2);
        }
      }
    }
  });

  test('should have horizontal scroll for long lines', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    const block = codeBlocks.first();
    const codeArea = block.locator('td.code').first();
    const overflowX = await codeArea.evaluate(el => {
      return window.getComputedStyle(el).overflowX;
    });

    expect(['auto', 'scroll', 'clip']).toContain(overflowX);
  });

  test('should not break layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const bodyWidth = await page.evaluate(() => {
      return document.body.scrollWidth;
    });

    expect(bodyWidth).toBeLessThanOrEqual(375 + 10);
  });

  test('should handle very long lines without wrapping', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const codeLines = page.locator('figure.highlight td.code pre');
    const count = await codeLines.count();

    if (count === 0) {
      test.skip('No code lines found');
      return;
    }

    const whiteSpace = await codeLines.first().evaluate(el => {
      return window.getComputedStyle(el).whiteSpace;
    });

    expect(['pre', 'pre-wrap', 'pre-line']).toContain(whiteSpace);
  });

  test('should have no gap between header and code body', async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const codeBlocks = page.locator('figure.highlight');
    if (await codeBlocks.count() === 0) {
      test.skip('No code blocks found');
      return;
    }

    const firstBlock = codeBlocks.first();
    const header = firstBlock.locator('.code-header');
    const content = firstBlock.locator('.highlight-content').first();

    const headerBox = await header.boundingBox();
    const contentBox = await content.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    if (headerBox && contentBox) {
      const gap = contentBox.y - (headerBox.y + headerBox.height);
      expect(gap).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('Code Block Theme Support', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/2025/02/06/rust-kaifa-huanjing/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should have dark theme styling', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const firstBlock = codeBlocks.first();
    const header = firstBlock.locator('.code-header');

    const headerStyles = await header.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor
      };
    });

    expect(headerStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should have light theme styling', async ({ page }) => {
    const codeBlocks = page.locator('figure.highlight');
    const count = await codeBlocks.count();

    if (count === 0) {
      test.skip('No code blocks found on this page');
      return;
    }

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    const firstBlock = codeBlocks.first();
    const header = firstBlock.locator('.code-header');

    const headerStyles = await header.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor
      };
    });

    expect(headerStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
