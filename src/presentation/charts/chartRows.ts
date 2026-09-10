import type { NetworkEvaluation, UnitId } from '../../domain/network/types';
import { activationSymbol, subscript } from '../notation/notation';

/**
 * Recharts consumes flat rows keyed by series name. The domain keeps its
 * layer/unit structure instead, so the flattening happens here and nowhere
 * else — including the keys that extra series on one chart have to occupy.
 */
export type ChartRow = { readonly x: number; readonly value: number } & Readonly<
  Record<string, number>
>;

export interface UnitRows {
  readonly z: readonly ChartRow[];
  readonly h: readonly ChartRow[];
}

/** A term of a plotted sum, drawn beneath it. */
export interface TermSeries {
  /** The key this term occupies in the flattened rows. */
  readonly key: string;
  /** The term as the equations write it, for example φ₁h₁. */
  readonly name: string;
}

export interface SumPlot {
  /** The sum under `value`, and every term under its own generated key. */
  readonly rows: readonly ChartRow[];
  readonly terms: readonly TermSeries[];
}

/**
 * Every row keeps the original scalar input x, so all of a unit's plots and the
 * output plot share the same horizontal positions.
 */
export function unitRows(samples: readonly NetworkEvaluation[], unitId: UnitId): UnitRows {
  const evaluations = samples.flatMap((sample) =>
    sample.layers.flatMap((layer) =>
      layer.units.filter((unit) => unit.unitId === unitId).map((unit) => ({ x: sample.x, unit })),
    ),
  );

  return {
    z: evaluations.map(({ x, unit }) => ({ x, value: unit.z })),
    h: evaluations.map(({ x, unit }) => ({ x, value: unit.h })),
  };
}

/**
 * y itself, and the weighted term φᵢhᵢ each unit puts into it. Both come from
 * the one evaluation, so the terms on the chart cannot disagree with the curve
 * they sum to. The keys are generated from the network's own connections, so
 * nothing here assumes how many units there are.
 */
export function outputPlot(samples: readonly NetworkEvaluation[]): SumPlot {
  return {
    terms: termsOf(samples),
    rows: samples.map((sample) => ({
      x: sample.x,
      value: sample.y,
      ...Object.fromEntries(
        sample.contributions.map((term) => [termKey(term.sourceId), term.value]),
      ),
    })),
  };
}

// The terms are the same for every sample, so the first one names them all.
// Sliced rather than indexed: no samples means no terms, not a missing row.
function termsOf(samples: readonly NetworkEvaluation[]): readonly TermSeries[] {
  return samples.slice(0, 1).flatMap((sample) =>
    sample.contributions.map((term, index) => ({
      key: termKey(term.sourceId),
      // Numbered by position in the output sum, which is how it is written, and
      // naming the activation the way the card that owns it does.
      name: `φ${subscript([index + 1])}${activationSymbol(depthOf(sample), index + 1, depthOf(sample))}`,
    })),
  );
}

function depthOf(sample: NetworkEvaluation): number {
  return sample.layers.length;
}

function termKey(sourceId: UnitId): string {
  return `term-${sourceId}`;
}
