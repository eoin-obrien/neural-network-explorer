import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('renders the application shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Neural network explorer');
});

test('resolves production assets from the custom-domain root', async ({ page }) => {
  await page.goto('/');

  const moduleSources = await page
    .locator('script[type="module"]')
    .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('src')));

  expect(moduleSources.length).toBeGreaterThan(0);
  for (const source of moduleSources) {
    expect(source).toMatch(/^\/assets\//);
  }
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');

  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(serious.map((violation) => violation.id)).toEqual([]);
});
