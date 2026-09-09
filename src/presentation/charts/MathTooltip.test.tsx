import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { theme } from '../theme';
import type { ChartRow } from './chartRows';
import { MathTooltip } from './MathTooltip';

const rows: readonly ChartRow[] = [
  { x: -0.5, value: -0.4 },
  { x: 0.25, value: 0.8 },
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
