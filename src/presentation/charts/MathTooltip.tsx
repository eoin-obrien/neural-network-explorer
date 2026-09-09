import { Paper, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { formatValue } from '../notation/notation';
import type { ChartRow } from './chartRows';

interface MathTooltipProps {
  /** The function being plotted, written as it is in the equations: z₁, h₁, y. */
  readonly name: string;
  readonly rows: readonly ChartRow[];
  /** Recharts injects these two when it clones the element it was given. */
  readonly active?: boolean | undefined;
  readonly label?: string | number | undefined;
}

/**
 * The hover read-out stated as mathematics rather than as a chart series:
 * `z₁(0.25) = 0.80`, not `0.25` above a colour swatch labelled `z₁`.
 *
 * The value is read back out of the rows the line was drawn from, keyed by the
 * sampled x Recharts reports, so the tooltip and the curve cannot disagree.
 * Filtering rather than indexing keeps the lookup total: a sample that is not
 * ours yields no statement instead of an absent one.
 */
export function MathTooltip({ name, rows, active, label }: MathTooltipProps): ReactElement | null {
  // Recharts renders the content whether or not the tooltip is showing, so an
  // inactive tooltip must render nothing rather than a stale statement.
  const statements =
    active === true
      ? rows
          .filter((row) => row.x === label)
          .map((row) => `${name}(${formatValue(row.x)}) = ${formatValue(row.value)}`)
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
