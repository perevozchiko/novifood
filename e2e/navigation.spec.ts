import { test, expect } from '@playwright/test';

/*
  E2E navigation smoke tests.

  Verifies that all four main pages are reachable and render their
  expected headings. These tests do NOT require a live Supabase
  connection — they assert only on static UI structure.

  The app defaults to English (no localStorage → lang = 'en'),
  so all expected strings are in English.
  Playwright desktop viewport (1280×720) triggers the sidebar layout:
  navigation links live in the <aside>, bottom nav is hidden.
*/

test.describe('Navigation', () => {
  test('navigate_ShouldLoadDiaryPage_WhenAppOpens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('NoviFood');
  });

  test('navigate_ShouldGoToHistoryPage_WhenHistoryLinkClicked', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/history"]');
    await expect(page).toHaveURL('/history');
    await expect(page.locator('h1')).toContainText('History');
  });

  test('navigate_ShouldGoToWeightPage_WhenWeightLinkClicked', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/weight"]');
    await expect(page).toHaveURL('/weight');
    await expect(page.locator('h1')).toContainText('Weight');
  });

  test('navigate_ShouldGoToSettingsPage_WhenSettingsLinkClicked', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1')).toContainText('Macro Goals');
  });

  test('navigate_ShouldSwitchToRussian_WhenRuButtonClicked', async ({ page }) => {
    await page.goto('/');
    // Find the language toggle in the sidebar (desktop viewport)
    await page.getByRole('button', { name: /Switch to Russian/i }).click();
    await expect(page.locator('h1')).toContainText('NoviFood');
    // Nav label should switch to Russian
    await expect(page.getByRole('link', { name: 'Дневник' }).first()).toBeVisible();
  });
});
