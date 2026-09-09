import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('renders the default preset with its architecture and parameter count', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shallow neural network');
  await expect(page.getByText('1 → 3 ReLU → 1')).toBeVisible();
  await expect(page.getByText('10 parameters')).toBeVisible();
  await expect(page.getByText(/^Neuron \d+$/)).toHaveCount(3);
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

test('a parameter slider changes the forward pass', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeVisible();

  await page.getByRole('slider', { name: 'θ₁₀ — intercept' }).press('ArrowRight');

  await expect(page.getByText('z₁ = 0.45 → h₁ = 0.45')).toBeVisible();
  await expect(page.getByText('y = 0.01')).toBeVisible();
});

test('excluding a unit changes the output and keeps its parameters', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('switch', { name: 'Neuron 1 included' }).click();

  await expect(page.getByText('Excluded from the output')).toBeVisible();
  await expect(page.getByText('y = -0.40')).toBeVisible();
  await expect(page.getByRole('slider', { name: 'θ₁₀ — intercept' })).toBeEnabled();
});

test('switching activation changes h without changing z', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('combobox', { name: 'Activation a[z]' }).click();
  await page.getByRole('option', { name: 'Identity' }).click();

  await expect(page.getByText('a[z] = z')).toBeVisible();
  await expect(page.getByText('z₂ = -0.20 → h₂ = -0.20')).toBeVisible();
});

test('the probe is keyboard operable and reports the forward pass', async ({ page }) => {
  await page.goto('/');

  const probe = page.getByRole('slider', { name: 'x — network input' });
  await probe.press('ArrowRight');
  await probe.press('ArrowRight');

  await expect(page.getByText('x = 0.10')).toBeVisible();
  await expect(page.getByText('z₁ = 0.56 → h₁ = 0.56')).toBeVisible();
});

test('reset restores the preset', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('slider', { name: 'φ₀ — output intercept' }).press('ArrowRight');
  await page.getByRole('button', { name: 'Reset' }).click();

  await expect(page.getByText('y = -0.04')).toBeVisible();
});

// The unit strip must scroll rather than compress its cards into unusable
// slivers, at any viewport and any unit count.
test.describe('the unit strip keeps its card width', () => {
  for (const viewport of [
    { width: 480, height: 900 },
    { width: 1600, height: 900 },
  ]) {
    test(`at ${String(viewport.width)}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const box = await page.getByRole('article', { name: 'Neuron 1' }).boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(300);
    });
  }
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');

  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  // Reported with their targets: a bare rule id says nothing about what failed.
  expect(
    serious.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`,
    ),
  ).toEqual([]);
});
