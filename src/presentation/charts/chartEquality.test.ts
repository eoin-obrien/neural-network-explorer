import { expect, test } from 'vitest';

import type { PlotProps } from './chartEquality';
import { samePlot } from './chartEquality';

const plot: PlotProps = {
  rows: [
    { x: -1, value: 0.5 },
    { x: 0, value: 1.5 },
  ],
  probeRows: [{ x: 0, value: 1.5 }],
  xDomain: [-1, 1],
  valueRange: { min: -3, max: 3 },
  color: 'blue.6',
  name: 'h₁',
  height: 96,
};

function changed(change: Partial<PlotProps>): boolean {
  return samePlot(plot, { ...plot, ...change });
}

test('a plot drawn from the same values is the same plot', () => {
  // Rebuilt rather than shared: this is the case that matters, because the
  // adapters hand the chart new arrays on every render.
  expect(
    samePlot(plot, {
      ...plot,
      rows: [
        { x: -1, value: 0.5 },
        { x: 0, value: 1.5 },
      ],
      probeRows: [{ x: 0, value: 1.5 }],
      valueRange: { min: -3, max: 3 },
      xDomain: [-1, 1],
    }),
  ).toBe(true);
});

test('a moved curve is a different plot', () => {
  expect(
    changed({
      rows: [
        { x: -1, value: 0.5 },
        { x: 0, value: 1.6 },
      ],
    }),
  ).toBe(false);
});

test('a curve of a different length is a different plot', () => {
  expect(changed({ rows: [{ x: -1, value: 0.5 }] })).toBe(false);
});

test('a moved probe is a different plot', () => {
  expect(changed({ probeRows: [{ x: 0.5, value: 1.5 }] })).toBe(false);
  expect(changed({ probeRows: [] })).toBe(false);
});

test('a rescaled value axis is a different plot', () => {
  expect(changed({ valueRange: { min: -2, max: 3 } })).toBe(false);
  expect(changed({ valueRange: { min: -3, max: 2 } })).toBe(false);
});

test('a different input domain is a different plot', () => {
  expect(changed({ xDomain: [-2, 1] })).toBe(false);
  expect(changed({ xDomain: [-1, 2] })).toBe(false);
});

test('a renamed, recoloured or resized plot is a different plot', () => {
  expect(changed({ name: 'z₁' })).toBe(false);
  expect(changed({ color: 'gray.7' })).toBe(false);
  expect(changed({ height: 220 })).toBe(false);
});

test('the overlaid terms are part of what the plot draws', () => {
  const withTerms: PlotProps = {
    ...plot,
    rows: [
      { x: -1, value: 0.5, 'term-a': 0.2 },
      { x: 0, value: 1.5, 'term-a': 0.4 },
    ],
    terms: [{ key: 'term-a', name: 'φ₁h₁' }],
  };

  expect(samePlot(withTerms, { ...withTerms, terms: [{ key: 'term-a', name: 'φ₁h₁' }] })).toBe(
    true,
  );
  // Turning the overlay off leaves the same curve with fewer series on it.
  expect(samePlot(withTerms, { ...withTerms, terms: [] })).toBe(false);
  expect(samePlot(withTerms, { ...withTerms, terms: [{ key: 'term-b', name: 'φ₁h₁' }] })).toBe(
    false,
  );
  expect(samePlot(withTerms, { ...withTerms, terms: [{ key: 'term-a', name: 'φ₂h₂' }] })).toBe(
    false,
  );
});

test('a term whose value moved is a different plot', () => {
  const withTerms: PlotProps = {
    ...plot,
    rows: [{ x: -1, value: 0.5, 'term-a': 0.2 }],
    terms: [{ key: 'term-a', name: 'φ₁h₁' }],
  };

  expect(samePlot(withTerms, { ...withTerms, rows: [{ x: -1, value: 0.5, 'term-a': 0.3 }] })).toBe(
    false,
  );
});

test('a row carrying an extra series is a different plot', () => {
  // Same x and value, one more key: the overlay arriving is a redraw.
  expect(
    changed({
      rows: [
        { x: -1, value: 0.5, 'term-a': 0.2 },
        { x: 0, value: 1.5 },
      ],
    }),
  ).toBe(false);
});
