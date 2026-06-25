import { test, expect } from '@playwright/test';

/*
  E2E tests for the diary (home) page.

  Checks that the "Add meal" button is present and opens the form.
  Full data-flow tests require a live Supabase environment.

  The app defaults to English (no localStorage → lang = 'en').
*/

test.describe('Diary page', () => {
  test('render_ShouldShowAddMealButton', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Add meal')).toBeVisible();
  });

  test('render_ShouldShowCameraButton', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Photograph dish')).toBeVisible();
  });

  test('addMealButton_ShouldOpenForm_WhenClicked', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Add meal').click();
    await expect(page.getByPlaceholder('Dish name')).toBeVisible();
  });

  test('addMealFormCancel_ShouldCloseForm_WhenCancelClicked', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Add meal').click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Add meal')).toBeVisible();
  });

  test('themeToggle_ShouldAddDarkClass_WhenClicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Switch to dark mode/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
