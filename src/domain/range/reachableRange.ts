/** A closed value interval used as a chart's value axis domain. */
export interface ValueRange {
  readonly min: number;
  readonly max: number;
}

// 5% of the observed span is added to each side, so the padded domain is 110%
// of the span. Padding is a fixed fraction with no rounding: axes must not
// jitter from frame to frame while a slider moves.
const paddingFraction = 0.05;

// A constant or near-constant function has (almost) no span of its own, so
// padding never falls below this absolute floor. This is what keeps a flat
// function from collapsing the axis to zero width.
const minimumPadding = 0.5;

// Used when nothing finite was sampled, so the result is still a usable axis.
const emptyCentre = 0;

/**
 * Deterministic value range reachable by the given samples.
 *
 * Non-finite samples are ignored rather than poisoning the range: a chart axis
 * must never be NaN, infinite, or zero-width.
 */
export function reachableRange(values: readonly number[]): ValueRange {
  const finite = values.filter(Number.isFinite);
  const min = finite.reduce((lowest, value) => Math.min(lowest, value), Number.POSITIVE_INFINITY);
  const max = finite.reduce((highest, value) => Math.max(highest, value), Number.NEGATIVE_INFINITY);

  if (!Number.isFinite(min)) {
    return padded(emptyCentre, emptyCentre);
  }

  return padded(min, max);
}

function padded(min: number, max: number): ValueRange {
  const padding = Math.max((max - min) * paddingFraction, minimumPadding);

  return { min: min - padding, max: max + padding };
}
