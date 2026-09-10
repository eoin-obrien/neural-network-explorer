import { LineChart } from '@mantine/charts';
import { Box, VisuallyHidden } from '@mantine/core';
import type { ReactElement } from 'react';
import { memo } from 'react';

import type { XDomain } from '../../domain/network/types';
import type { ValueRange } from '../../domain/range/reachableRange';
import { formatValue } from '../notation/notation';
import { samePlot } from './chartEquality';
import type { ChartRow, TermSeries } from './chartRows';
import { MathTooltip } from './MathTooltip';

interface FunctionChartProps {
  readonly rows: readonly ChartRow[];
  /** The probe as a row of this same function: none, or exactly one. */
  readonly probeRows: readonly ChartRow[];
  /** Terms of the plotted sum, drawn beneath it. A plain function has none. */
  readonly terms?: readonly TermSeries[];
  readonly xDomain: XDomain;
  readonly valueRange: ValueRange;
  readonly color: string;
  /** The function's name in the equations: z₁, h₁, y. */
  readonly name: string;
  readonly height: number;
}

// Every plot of the forward pass shares one synchronization id, so a hover on
// any of them inspects the same x on all of them. Recharts matches synchronized
// charts by row index, which is exact here precisely because every plot is
// drawn from the one shared set of sampled x positions.
const syncId = 'forward-pass';

// A term is drawn quieter and dashed so the sum stays the figure of the chart
// and the terms read as what it is made of.
const termColor = 'gray.6';
const termDash = '4 4';

/**
 * Skipped when this plot would draw exactly what it drew last time. Every
 * parameter change re-renders the whole explorer, but it moves only the curves
 * that read the parameter: at eight units that is three plots of seventeen, and
 * the other fourteen were re-rendering identically.
 */
export const FunctionChart = memo(FunctionChartView, samePlot);

function FunctionChartView({
  rows,
  probeRows,
  terms = [],
  xDomain,
  valueRange,
  color,
  name,
  height,
}: FunctionChartProps): ReactElement {
  return (
    // A named figure: the plot is announced as z₁ or h₁ rather than as an
    // anonymous graphic, and the mathematics stays readable as text beside it.
    <Box component="figure" m={0} aria-label={`${name} against x`}>
      <LineChart
        h={height}
        // Recharts types its rows as Record<string, any>, which a readonly
        // interface is not assignable to; this is where that shape is adopted.
        data={rows.map((row) => ({ ...row }))}
        dataKey="x"
        series={[
          { name: 'value', label: name, color },
          ...terms.map((term) => ({
            name: term.key,
            label: term.name,
            color: termColor,
            strokeDasharray: termDash,
          })),
        ]}
        lineChartProps={{ syncId, syncMethod: 'index' }}
        // The horizontal axis stays the original scalar input at every stage of
        // the forward pass, so one x means the same thing in every chart.
        xAxisProps={{ type: 'number', domain: [xDomain[0], xDomain[1]], tickCount: 5 }}
        // The value axis, chosen by the scale policy rather than by Recharts.
        // The ticks are the ends and the midpoint rather than a count, because a
        // count lets Recharts drop whichever labels do not fit and leaves a
        // lopsided axis.
        yAxisProps={{
          domain: [valueRange.min, valueRange.max],
          ticks: [valueRange.min, (valueRange.min + valueRange.max) / 2, valueRange.max],
        }}
        // The persistent probe, marked on the curve itself: the line says which
        // x, the dot says what this function is worth there. Both are unlabelled
        // because the probe control and the forward-pass summary state the
        // values, and seven captioned charts would be noise.
        //
        // The line is solid where the grid and the hover cursor are dashed, so a
        // pinned probe never reads as a stray hover.
        referenceLines={probeRows.map((row) => ({ x: row.x, color: 'gray.5' }))}
        referenceDots={probeRows.map((row) => ({ x: row.x, y: row.value, color, r: 4 }))}
        tooltipProps={{ content: <MathTooltip name={name} terms={terms} rows={rows} /> }}
        // ReLU is piecewise linear. A smoothed curve would draw bends the
        // mathematics does not have.
        curveType="linear"
        withDots={false}
        // Sliders emit a continuous stream of values; an animation per event
        // would queue up and leave the plotted function trailing behind the
        // control. The same reasoning applies to the hover read-out, which has
        // to keep up with the pointer.
        lineProps={{ isAnimationActive: false }}
        tooltipAnimationDuration={0}
        valueFormatter={formatValue}
        strokeWidth={2}
        gridAxis="xy"
      />
      {/* What the plot currently draws, as text: the span of its value axis,
          and the terms overlaid on it. Switching the scale or the overlay is
          then perceivable without reading a small chart, and without the plot's
          own name changing under a screen reader as the reachable range follows
          the sliders. */}
      <VisuallyHidden component="figcaption">{caption(name, valueRange, terms)}</VisuallyHidden>
    </Box>
  );
}

function caption(name: string, valueRange: ValueRange, terms: readonly TermSeries[]): string {
  const axis = `${name} from ${formatValue(valueRange.min)} to ${formatValue(valueRange.max)}`;

  return terms.length === 0
    ? axis
    : `${axis}, with terms ${terms.map((term) => term.name).join(', ')}`;
}
