import { expect, test } from '@playwright/test';

async function captureBrowserErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function startWithEmptyTasks(page) {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('quicktask.e2e.initialized')) {
      window.localStorage.clear();
      window.sessionStorage.setItem('quicktask.e2e.initialized', 'true');
    }
  });
  const errors = await captureBrowserErrors(page);
  await page.goto('/');
  return errors;
}

test('task entry accepts button and Enter submissions and rejects blank input', async ({ page }) => {
  const errors = await startWithEmptyTasks(page);
  await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();
  await page.screenshot({ path: 'test-results/quicktask-empty-desktop.png', fullPage: true });

  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('  Prepare weekly notes  ');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByText('Prepare weekly notes')).toBeVisible();
  await expect(input).toHaveValue('');

  await input.fill('Send the update');
  await input.press('Enter');
  await expect(page.getByText('2 total')).toBeVisible();
  await expect(page.getByRole('listitem').nth(0)).toContainText('Prepare weekly notes');
  await expect(page.getByRole('listitem').nth(1)).toContainText('Send the update');

  await input.fill('   ');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByText('2 total')).toBeVisible();
  await expect(input).toHaveValue('   ');
  expect(errors).toEqual([]);
});

test('completion toggles both ways and updates progress counts', async ({ page }) => {
  const errors = await startWithEmptyTasks(page);
  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('Read a chapter');
  await input.press('Enter');

  const checkbox = page.getByRole('checkbox', { name: 'Read a chapter' });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(page.getByText('Read a chapter')).toHaveClass(/is-complete/);
  await expect(page.getByText('1 completed')).toBeVisible();

  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByText('Read a chapter')).not.toHaveClass(/is-complete/);
  await expect(page.getByText('0 completed')).toBeVisible();
  expect(errors).toEqual([]);
});

test('deletion removes the selected task and restores the empty state', async ({ page }) => {
  const errors = await startWithEmptyTasks(page);
  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('Keep this');
  await input.press('Enter');
  await input.fill('Remove this');
  await input.press('Enter');

  await page.getByRole('button', { name: 'Delete Remove this' }).click();
  await expect(page.getByText('Remove this')).not.toBeVisible();
  await expect(page.getByText('1 total')).toBeVisible();

  await page.getByRole('button', { name: 'Delete Keep this' }).click();
  await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();
  await expect(page.getByText('0 total')).toBeVisible();
  await expect(page.getByText('0 completed')).toBeVisible();
  expect(errors).toEqual([]);
});

test('tasks and completion state persist after reload', async ({ page }) => {
  const errors = await startWithEmptyTasks(page);
  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('Persist this task');
  await input.press('Enter');
  await page.getByRole('checkbox', { name: 'Persist this task' }).check();
  await expect(page.getByText('1 completed')).toBeVisible();
  await page.screenshot({ path: 'test-results/quicktask-completed-desktop.png', fullPage: true });

  await page.reload();
  await expect(page.getByText('Persist this task')).toHaveClass(/is-complete/);
  await expect(page.getByRole('checkbox', { name: 'Persist this task' })).toBeChecked();
  await expect(page.getByText('1 total')).toBeVisible();
  await expect(page.getByText('1 completed')).toBeVisible();
  expect(errors).toEqual([]);
});

test('task entry and list remain usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = await startWithEmptyTasks(page);
  await expect(page.getByRole('heading', { name: 'QuickTask' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Enter a task' })).toBeVisible();
  await page.screenshot({ path: 'test-results/quicktask-mobile-empty.png', fullPage: true });

  const input = page.getByRole('textbox', { name: 'Enter a task' });
  await input.fill('Mobile task');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByText('Mobile task')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Mobile task' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Mobile task' })).toBeVisible();
  expect(errors).toEqual([]);
});
