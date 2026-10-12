import { expect, test } from '@playwright/test';

const browserErrors = [];

test.beforeEach(async ({ page }) => {
  browserErrors.length = 0;
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('adds, completes, reopens, persists, and deletes tasks', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'QuickTask' })).toBeVisible();
  await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();

  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('  Prepare weekly notes  ');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByText('Prepare weekly notes')).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(page.getByText('1 total')).toBeVisible();
  await expect(page.getByText('0 completed')).toBeVisible();

  const checkbox = page.getByRole('checkbox', { name: 'Prepare weekly notes' });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(page.getByText('Prepare weekly notes')).toHaveClass(/is-complete/);
  await expect(page.getByText('1 completed')).toBeVisible();

  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByText('0 completed')).toBeVisible();

  await input.fill('Send the update');
  await input.press('Enter');
  await expect(page.getByText('2 total')).toBeVisible();
  await expect(page.getByRole('listitem').nth(0)).toContainText('Prepare weekly notes');
  await expect(page.getByRole('listitem').nth(1)).toContainText('Send the update');

  await page.reload();
  await expect(page.getByText('Prepare weekly notes')).toBeVisible();
  await expect(page.getByText('Send the update')).toBeVisible();
  await expect(page.getByText('2 total')).toBeVisible();

  await page.getByRole('button', { name: 'Delete Prepare weekly notes' }).click();
  await expect(page.getByText('Prepare weekly notes')).not.toBeVisible();
  await expect(page.getByText('1 total')).toBeVisible();

  await page.getByRole('button', { name: 'Delete Send the update' }).click();
  await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();
  await expect(page.getByText('0 total')).toBeVisible();
  await expect(page.getByText('0 completed')).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test('rejects whitespace-only input without changing the list', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('   ');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();
  await expect(page.getByText('0 total')).toBeVisible();
  expect(browserErrors).toEqual([]);
});
