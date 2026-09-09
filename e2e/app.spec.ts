import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
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

// Synchronized hover is the integration that unit tests cannot reach: it lives
// in chart geometry and Recharts' synchronization, not in our own functions.
test('hovering one plot inspects the same x across the whole forward pass', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('figure', { name: 'z₁ against x' }).hover();

  const hovered = await inspectedInput(page, 'z₁');

  expect(hovered).toMatch(/^-?\d\.\d\d$/);
  // Neither of these was hovered; both are reporting the hovered sample.
  expect(await inspectedInput(page, 'h₃')).toBe(hovered);
  expect(await inspectedInput(page, 'y')).toBe(hovered);
});

test('the tooltip states the mathematics rather than a chart series', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('figure', { name: 'y against x' }).hover();

  await expect(page.getByText(/^y\(-?\d\.\d\d\) = -?\d\.\d\d$/)).toBeVisible();
});

test('a plot reports nothing until it is inspected', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/^y\(/)).toHaveCount(0);
});

// The axis is redrawn by Recharts from a domain our own policy chose, so the
// tick labels are the only place the two halves are seen to agree.
test('switching to reachable scaling redraws the value axis', async ({ page }) => {
  await page.goto('/');

  const plot = page.getByRole('figure', { name: 'z₁ against x' });
  await expect(plot.getByText('3.00', { exact: true })).toBeVisible();

  await scaleMode(page, 'Reachable').click();

  await expect(page.getByText('Axes from the values reached over x')).toBeVisible();
  await expect(plot.getByText('2.25', { exact: true })).toBeVisible();
  await expect(plot.getByText('3.00', { exact: true })).toHaveCount(0);
  // The horizontal axis is untouched: reachable scaling is a value-axis policy,
  // and x still runs over the preset's own input domain.
  await expect(plot.getByText('-1', { exact: true })).toBeVisible();
  await expect(page.getByText('z₁ = 0.40 → h₁ = 0.40')).toBeVisible();
});

test('reachable scaling stays usable while a slider moves', async ({ page }) => {
  await page.goto('/');

  await scaleMode(page, 'Reachable').click();
  await page.getByRole('slider', { name: 'θ₁₀ — intercept' }).press('ArrowRight');

  await expect(page.getByText('z₁ = 0.45 → h₁ = 0.45')).toBeVisible();
  await expect(page.getByRole('figure', { name: 'z₁ against x' })).toBeVisible();
});

test('a discrete transition stays inside the motion budget', async ({ page }) => {
  await page.goto('/');

  const duration = await cardTransitionSeconds(page);

  expect(duration).toBeGreaterThanOrEqual(0.12);
  expect(duration).toBeLessThanOrEqual(0.18);
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('motion is removed and every change is still stated', async ({ page }) => {
    await page.goto('/');

    expect(await cardTransitionSeconds(page)).toBeLessThan(0.01);

    await page.getByRole('switch', { name: 'Neuron 1 included' }).click();
    await expect(page.getByText('Excluded from the output')).toBeVisible();
    await expect(page.getByText('y = -0.40')).toBeVisible();

    await scaleMode(page, 'Reachable').click();
    await expect(page.getByText('Axes from the values reached over x')).toBeVisible();
  });
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

/** The scale control's option, clicked by its label as a pointer would. */
function scaleMode(page: Page, label: string): Locator {
  return page.getByRole('radiogroup', { name: 'Chart scale' }).getByText(label, { exact: true });
}

/** How long a unit card takes to settle into its included/excluded state. */
async function cardTransitionSeconds(page: Page): Promise<number> {
  const duration = await page
    .getByRole('article', { name: 'Neuron 1' })
    .evaluate((card) => getComputedStyle(card).transitionDuration);

  return Number.parseFloat(duration);
}

/** The x a plot's tooltip is currently reporting, read out of its statement. */
async function inspectedInput(page: Page, name: string): Promise<string | undefined> {
  const statement = await page.getByText(new RegExp(`^${name}\\(`)).textContent();

  return /\((-?\d+\.\d+)\)/.exec(statement ?? '')?.[1];
}

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
