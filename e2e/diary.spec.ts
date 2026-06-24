import { test, expect } from '@playwright/test';

/*
  E2E tests for the diary (home) page.

  Checks that the "Add meal" button is present and opens the form.
  Full data-flow tests require a live Supabase environment.
*/

test.describe('Diary page', () => {
  test('render_ShouldShowAddMealButton', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Добавить блюдо')).toBeVisible();
  });

  test('render_ShouldShowCameraButton', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Сфотографировать блюдо')).toBeVisible();
  });

  test('addMealButton_ShouldOpenForm_WhenClicked', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Добавить блюдо').click();
    await expect(page.getByPlaceholder('Название блюда')).toBeVisible();
  });

  test('addMealFormCancel_ShouldCloseForm_WhenCancelClicked', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Добавить блюдо').click();
    await page.getByText('Отмена').click();
    await expect(page.getByText('Добавить блюдо')).toBeVisible();
  });
});
