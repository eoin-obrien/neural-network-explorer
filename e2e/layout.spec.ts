import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// How the unit strip behaves as a layout: the cards keep their width, the strip
// takes any overflow rather than the document, and it stays operable without a
// pointer. Split from app.spec.ts, which covers the mathematics and controls.

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

// Widening a layer past what the viewport can show must move the strip, not the
// document: a page that scrolls sideways drags the equations and the output
// chart off screen along with the cards.
test('a layer wider than the viewport scrolls the strip, not the page', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto('/');

  // The widest the control allows: eight cards at 300px against a 480px
  // viewport is the worst case the strip has to absorb. Five clicks takes the
  // preset's three units to that cap.
  const add = page.getByRole('button', { name: 'Add a neuron to hidden layer 1' });
  for (let click = 0; click < 5; click += 1) {
    await add.click();
  }
  await expect(add).toBeDisabled();

  const strip = page.getByRole('group', { name: 'Hidden layer 1 neurons' });

  // The strip is the element that overflows, and it is the element that takes
  // the scrolling. A viewport that fits its content would report nothing here.
  expect(await overflowOf(strip)).toBeGreaterThan(0);

  const last = page.getByRole('article', { name: 'Neuron 8' });
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();

  expect(await horizontalOverflow(page)).toBe(0);
  // The output chart stayed put while the strip moved beneath it.
  await expect(page.getByRole('figure', { name: 'y against x' })).toBeInViewport();
});

// Tabbing through three sliders a card to reach the next one is not scrolling.
// The strip takes focus itself so a keyboard can move it directly, which is the
// only pointer-free equivalent of dragging the bar.
//
// Axe does not demand this: the cards' own controls already make the region
// reachable. The Axe check rides along because a widened strip is a state the
// principal-view scan never reaches.
test('a scrolling strip is keyboard reachable and free of Axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto('/');

  const add = page.getByRole('button', { name: 'Add a neuron to hidden layer 1' });
  for (let click = 0; click < 5; click += 1) {
    await add.click();
  }

  const strip = page.getByRole('group', { name: 'Hidden layer 1 neurons' });
  await strip.focus();
  await expect(strip).toBeFocused();

  for (let press = 0; press < 5; press += 1) {
    await strip.press('ArrowRight');
  }
  expect(await scrollLeftOf(strip)).toBeGreaterThan(0);

  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(
    serious.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`,
    ),
  ).toEqual([]);
});

/** How much of the strip's content sits beyond its own visible width. */
async function overflowOf(strip: Locator): Promise<number> {
  return strip.evaluate((element) => element.scrollWidth - element.clientWidth);
}

/** How far the strip has actually been scrolled. */
async function scrollLeftOf(strip: Locator): Promise<number> {
  return strip.evaluate((element) => element.scrollLeft);
}

/** How far the document itself can be scrolled sideways. Should always be none. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
