import type { XDomain } from '../../domain/network/types';
import type { ValueRange } from '../../domain/range/reachableRange';
import type { ChartRow, TermSeries } from './chartRows';

/**
 * Everything a plot draws. Structural rather than the component's own props so
 * the comparison can be specified on its own, without the chart importing the
 * module that describes it and the module importing the chart back.
 */
export interface PlotProps {
  readonly rows: readonly ChartRow[];
  readonly probeRows: readonly ChartRow[];
  readonly terms?: readonly TermSeries[] | undefined;
  readonly xDomain: XDomain;
  readonly valueRange: ValueRange;
  readonly color: string;
  readonly name: string;
  readonly height: number;
}

/**
 * Whether two renders would draw the same plot.
 *
 * The adapters rebuild every row on every render, so a curve that has not moved
 * still arrives as a new array and redraws for nothing. Moving one theta
 * changes three plots of seventeen; comparing the values is what lets the other
 * fourteen be skipped.
 *
 * Worth comparing: a plot costs milliseconds to draw and microseconds to check.
 */
export function samePlot(previous: PlotProps, next: PlotProps): boolean {
  return sameFrame(previous, next) && sameSeries(previous, next);
}

/** What the plot is drawn on: its name, its colour, and both of its axes. */
function sameFrame(previous: PlotProps, next: PlotProps): boolean {
  return (
    previous.name === next.name &&
    previous.color === next.color &&
    previous.height === next.height &&
    previous.xDomain[0] === next.xDomain[0] &&
    previous.xDomain[1] === next.xDomain[1] &&
    sameRange(previous.valueRange, next.valueRange)
  );
}

/** What is drawn on it: the curve, the probe marked on it, and any terms. */
function sameSeries(previous: PlotProps, next: PlotProps): boolean {
  return (
    sameRows(previous.rows, next.rows) &&
    sameRows(previous.probeRows, next.probeRows) &&
    sameTerms(previous.terms ?? [], next.terms ?? [])
  );
}

function sameRange(previous: ValueRange, next: ValueRange): boolean {
  return previous.min === next.min && previous.max === next.max;
}

function sameRows(previous: readonly ChartRow[], next: readonly ChartRow[]): boolean {
  return (
    previous.length === next.length &&
    pairs(previous, next).every(({ left, right }) => sameRow(left, right))
  );
}

// Every value in a row is a number, so key by key is the whole comparison. Read
// through the index rather than by name because the term series occupy keys
// generated from the network's own connections.
function sameRow(previous: ChartRow, next: ChartRow): boolean {
  const keys = Object.keys(previous);

  return (
    keys.length === Object.keys(next).length && keys.every((key) => previous[key] === next[key])
  );
}

function sameTerms(previous: readonly TermSeries[], next: readonly TermSeries[]): boolean {
  return (
    previous.length === next.length &&
    pairs(previous, next).every(
      ({ left, right }) => left.key === right.key && left.name === right.name,
    )
  );
}

/**
 * The two sequences walked together. Sliced rather than indexed so a pair is
 * always whole: a position the second sequence does not reach yields no pair
 * instead of an absent element. Callers compare lengths first, so every
 * position does reach.
 */
function pairs<T>(
  left: readonly T[],
  right: readonly T[],
): readonly { readonly left: T; readonly right: T }[] {
  return left.flatMap((value, index) =>
    right.slice(index, index + 1).map((other) => ({ left: value, right: other })),
  );
}
