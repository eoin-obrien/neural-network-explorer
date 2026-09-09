import { LineChart } from '@mantine/charts';
import type { ReactElement } from 'react';

import type { XDomain } from '../../domain/network/types';
import type { ValueRange } from '../../domain/range/reachableRange';
import { formatValue } from '../notation/notation';
import type { ChartRow } from './chartRows';

interface FunctionChartProps {
  readonly rows: readonly ChartRow[];
  readonly xDomain: XDomain;
  readonly valueRange: ValueRange;
  readonly color: string;
  readonly label: string;
  readonly height: number;
}

export function FunctionChart({
  rows,
  xDomain,
  valueRange,
  color,
  label,
  height,
}: FunctionChartProps): ReactElement {
  return (
    <LineChart
      h={height}
      // Recharts types its rows as Record<string, any>, which a readonly
      // interface is not assignable to; this is where that shape is adopted.
      data={rows.map((row) => ({ x: row.x, value: row.value }))}
      dataKey="x"
      series={[{ name: 'value', label, color }]}
      // The horizontal axis stays the original scalar input at every stage of
      // the forward pass, so one x means the same thing in every chart.
      xAxisProps={{ type: 'number', domain: [xDomain[0], xDomain[1]], tickCount: 5 }}
      // Fixed teaching scale: the preset chooses the axis so magnitude changes
      // stay comparable instead of the axis chasing the line. The ticks are the
      // ends and the midpoint rather than a count, because a count lets Recharts
      // drop whichever labels do not fit and leaves a lopsided axis.
      yAxisProps={{
        domain: [valueRange.min, valueRange.max],
        ticks: [valueRange.min, (valueRange.min + valueRange.max) / 2, valueRange.max],
      }}
      // ReLU is piecewise linear. A smoothed curve would draw bends the
      // mathematics does not have.
      curveType="linear"
      withDots={false}
      // Sliders emit a continuous stream of values; an animation per event
      // would leave the plotted function trailing behind the control.
      lineProps={{ isAnimationActive: false }}
      valueFormatter={formatValue}
      strokeWidth={2}
      gridAxis="xy"
    />
  );
}
