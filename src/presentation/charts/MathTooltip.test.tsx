import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { theme } from '../theme';
import type { ChartRow, TermSeries } from './chartRows';
import { MathTooltip } from './MathTooltip';

const rows: readonly ChartRow[] = [
  { x: -0.5, value: -0.4 },
  { x: 0.25, value: 0.8 },
];

// The sum plot carries a term per unit alongside y under a generated key.
const sumRows: readonly ChartRow[] = [
  { x: 0.25, value: 0.8, 'term-unit-1': 0.36, 'term-unit-2': -0.2 },
];

const terms: readonly TermSeries[] = [
  { key: 'term-unit-1', name: 'φ₁h₁' },
  { key: 'term-unit-2', name: 'φ₂h₂' },
];

function renderTooltip(props: { active?: boolean; label?: number }): void {
  render(
    <MantineProvider theme={theme}>
      <MathTooltip name="z₁" rows={rows} {...props} />
    </MantineProvider>,
  );
}

test('the hovered sample is stated as the function evaluated at that x', () => {
  renderTooltip({ active: true, label: 0.25 });

  expect(screen.getByText('z₁(0.25) = 0.80')).toBeDefined();
});

test('an inactive tooltip states nothing rather than the last sample it saw', () => {
  renderTooltip({ active: false, label: 0.25 });

  expect(screen.queryByText(/^z₁\(/)).toBeNull();
});

// Recharts reports the label of whichever chart is asking, so a label that is
// not one of these rows must yield no statement rather than a wrong one.
test('a label that matches no sample states nothing', () => {
  renderTooltip({ active: true, label: 0.3 });

  expect(screen.queryByText(/^z₁\(/)).toBeNull();
});

// The input is stated once, on the function itself: repeating (0.25) on every
// term would say four times what the shared x already guarantees.
test('a sum states its own value and then each of its terms', () => {
  render(
    <MantineProvider theme={theme}>
      <MathTooltip name="y" terms={terms} rows={sumRows} active label={0.25} />
    </MantineProvider>,
  );

  expect(screen.getByText('y(0.25) = 0.80')).toBeDefined();
  expect(screen.getByText('φ₁h₁ = 0.36')).toBeDefined();
  expect(screen.getByText('φ₂h₂ = -0.20')).toBeDefined();
});

// A term whose key is not in the rows is a plot and an overlay that disagree.
// Saying nothing about it beats stating a fabricated zero.
test('a term the rows do not carry is not invented', () => {
  render(
    <MantineProvider theme={theme}>
      <MathTooltip
        name="y"
        terms={[{ key: 'term-absent', name: 'φ₉h₉' }]}
        rows={sumRows}
        active
        label={0.25}
      />
    </MantineProvider>,
  );

  expect(screen.getByText('y(0.25) = 0.80')).toBeDefined();
  expect(screen.queryByText(/^φ₉h₉/)).toBeNull();
});
