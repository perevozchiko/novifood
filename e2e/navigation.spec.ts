import { test, expect } from '@playwright/test';

/*
  E2E navigation smoke tests.

  Verifies that all four main pages are reachable and render their
  expected headings. These tests do NOT require a live Supabase
  connection — they assert only on static UI structure.
*/

test.describe('Bottom navigation', () => {
  test('navigate_ShouldLoadDiaryPage_WhenAppOpens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('NoviFood');
  });

  test('navigate_ShouldGoToHistoryPage_WhenHistoryLinkClicked', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/history"]');
    await expect(page).toHaveURL('/history');
    await expect(page.locator('h1')).toContainText('История');
  });

  test('navigate_ShouldGoToWeightPage_WhenWeightLinkClicked', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/weight"]');
    await expect(page).toHaveURL('/weight');
    await expect(page.locator('h1')).toContainText('Вес');
  });

  test('navigate_ShouldGoToSettingsPage_WhenSettingsLinkClicked', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1')).toContainText('Цели КБЖУ');
  });
});
