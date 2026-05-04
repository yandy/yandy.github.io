import { test, expect } from '@playwright/test';

/**
 * Inter-Post Link Resolution Tests
 *
 * Verifies that Markdown links like [text](./target.md) in source posts
 * are correctly resolved to the target post's permalink URL.
 */

// Known post title → expected permalink mapping
const postPermalinks: Record<string, string> = {
	'C++': '/2024/10/15/cpp-kaifa-huanjing/',
	'Rust': '/2025/02/06/rust-kaifa-huanjing/',
	'Javascript': '/2024/11/06/javascript-kaifa-huanjing/',
	'Python': '/2024/11/09/python-kaifa-huanjing/',
	'OpenCode': '/2026/04/30/opencode/',
	'安装 WSL': '/2024/10/06/wsl-kaifa-huanjing/',
	'美化': '/2024/11/02/windows-terminal-meihua/',
	'开发环境配置(合集)': '/2026/03/17/develop-env-setup/',
	'常用桌面软件安装与配置': '/2026/03/12/cachy-os-changyong-ruanjian/',
};

test.describe('Inter-Post Markdown Link Resolution', () => {

	test('should resolve .md links to correct permalinks in develop-env-setup', async ({ page }) => {
		await page.goto('/2026/03/17/develop-env-setup/');

		// Check each inter-post link
		const cppLink = page.locator('a[href="/2024/10/15/cpp-kaifa-huanjing/"]');
		await expect(cppLink).toBeVisible();
		await expect(cppLink).toHaveText('C++');

		const rustLink = page.locator('a[href="/2025/02/06/rust-kaifa-huanjing/"]');
		await expect(rustLink).toBeVisible();
		await expect(rustLink).toHaveText('Rust');

		const jsLink = page.locator('a[href="/2024/11/06/javascript-kaifa-huanjing/"]');
		await expect(jsLink).toBeVisible();
		await expect(jsLink).toHaveText('Javascript');

		const pyLink = page.locator('a[href="/2024/11/09/python-kaifa-huanjing/"]');
		await expect(pyLink).toBeVisible();
		await expect(pyLink).toHaveText('Python');

		const opencodeLink = page.locator('a[href="/2026/04/30/opencode/"]');
		await expect(opencodeLink.first()).toBeVisible();
		await expect(opencodeLink.first()).toHaveText('OpenCode');
	});

	test('should resolve .md links to correct permalinks in windows-kaifa-huanjing', async ({ page }) => {
		await page.goto('/2024/10/06/windows-kaifa-huanjing/');

		const wslLink = page.locator('a[href="/2024/10/06/wsl-kaifa-huanjing/"]');
		await expect(wslLink.first()).toBeVisible();

		const terminalLink = page.locator('a[href="/2024/11/02/windows-terminal-meihua/"]');
		await expect(terminalLink.first()).toBeVisible();
		await expect(terminalLink.first()).toHaveText('美化');

		const cppLink = page.locator('a[href="/2024/10/15/cpp-kaifa-huanjing/"]');
		await expect(cppLink.first()).toBeVisible();

		const rustLink = page.locator('a[href="/2025/02/06/rust-kaifa-huanjing/"]');
		await expect(rustLink.first()).toBeVisible();

		const jsLink = page.locator('a[href="/2024/11/06/javascript-kaifa-huanjing/"]');
		await expect(jsLink.first()).toBeVisible();

		const pyLink = page.locator('a[href="/2024/11/09/python-kaifa-huanjing/"]');
		await expect(pyLink.first()).toBeVisible();
	});

	test('should resolve .md links to correct permalinks in graphify', async ({ page }) => {
		await page.goto('/2026/04/30/graphify/');

		const opencodeLink = page.locator('a[href="/2026/04/30/opencode/"]');
		await expect(opencodeLink.first()).toBeVisible();
		await expect(opencodeLink.first()).toHaveText('OpenCode');
	});

	test('should resolve .md links to correct permalinks in cachy-os-archlinux-setup-recording', async ({ page }) => {
		await page.goto('/2026/03/10/cachy-os-archlinux-setup-recording/');

		const devLink = page.locator('a[href="/2026/03/17/develop-env-setup/"]');
		await expect(devLink.first()).toBeVisible();

		const softwareLink = page.locator('a[href="/2026/03/12/cachy-os-changyong-ruanjian/"]');
		await expect(softwareLink.first()).toBeVisible();
	});

	test('should NOT contain any raw .md links in page content', async ({ page }) => {
		await page.goto('/2026/03/17/develop-env-setup/');

		// Get all links on the page
		const links = page.locator('a[href]');
		const count = await links.count();

		for (let i = 0; i < count; i++) {
			const href = await links.nth(i).getAttribute('href');
			expect(href, `Link #${i} should not contain .md: ${href}`).not.toMatch(/\.md$/);
			expect(href, `Link #${i} should not contain .md: ${href}`).not.toMatch(/\.md#/);
		}
	});

	test('should navigate correctly when clicking resolved inter-post links', async ({ page }) => {
		await page.goto('/2026/03/17/develop-env-setup/');

		// Click the C++ link
		await page.locator('a[href="/2024/10/15/cpp-kaifa-huanjing/"]').click();
		await expect(page).toHaveURL(/\/2024\/10\/15\/cpp-kaifa-huanjing\//);
		await expect(page.locator('h1')).toContainText('C++');
	});

});
