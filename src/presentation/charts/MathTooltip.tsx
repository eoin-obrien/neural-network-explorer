import { Paper, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { formatValue } from '../notation/notation';
import type { ChartRow, TermSeries } from './chartRows';

interface MathTooltipProps {
  /** The function being plotted, written as it is in the equations: z₁, h₁, y. */
  readonly name: string;
  /** Terms of the plotted sum, reported beneath it. A plain function has none. */
  readonly terms?: readonly TermSeries[];
  readonly rows: readonly ChartRow[];
  /** Recharts injects these two when it clones the element it was given. */
  readonly active?: boolean | undefined;
  readonly label?: string | number | undefined;
}

/**
 * The hover read-out stated as mathematics rather than as a chart series:
 * `z₁(0.25) = 0.80`, not `0.25` above a colour swatch labelled `z₁`.
 *
 * Where the plot is a sum, its terms follow it as the equation writes them:
 *
 *   y(0.25) = 0.80
 *   φ₁h₁ = 0.36
 *
 * The input is stated once, on the function itself. Repeating `(0.25)` on every
 * term would say four times what the shared x already guarantees.
 *
 * Values are read back out of the rows the lines were drawn from, keyed by the
 * sampled x Recharts reports, so the tooltip and the curves cannot disagree.
 * Filtering rather than indexing keeps the lookup total: a sample that is not
 * ours yields no statement instead of an absent one.
 */
export function MathTooltip({
  name,
  terms = [],
  rows,
  active,
  label,
}: MathTooltipProps): ReactElement | null {
  // Recharts renders the content whether or not the tooltip is showing, so an
  // inactive tooltip must render nothing rather than a stale statement.
  const statements =
    active === true
      ? rows
          .filter((row) => row.x === label)
          .flatMap((row) => [
            `${name}(${formatValue(row.x)}) = ${formatValue(row.value)}`,
            ...terms.flatMap((term) =>
              termValues(row, term.key).map((value) => `${term.name} = ${formatValue(value)}`),
            ),
          ])
      : [];

  return statements.length === 0 ? null : (
    <Paper withBorder shadow="sm" px="xs" py={4}>
      {statements.map((statement) => (
        <Text key={statement} size="xs" ff="monospace">
          {statement}
        </Text>
      ))}
    </Paper>
  );
}

// Filtered rather than indexed, for the same reason the rows are: a key the row
// does not carry yields no statement instead of a fabricated zero.
function termValues(row: ChartRow, key: string): readonly number[] {
  return Object.entries(row)
    .filter(([name]) => name === key)
    .map(([, value]) => value);
}
