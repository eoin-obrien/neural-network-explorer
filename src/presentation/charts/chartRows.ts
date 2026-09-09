import type { NetworkEvaluation, UnitId } from '../../domain/network/types';

/**
 * Recharts consumes flat rows keyed by name. The domain keeps its layer/unit
 * structure instead, so the flattening happens here and nowhere else.
 */
export interface ChartRow {
  readonly x: number;
  readonly value: number;
}

export interface UnitRows {
  readonly z: readonly ChartRow[];
  readonly h: readonly ChartRow[];
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

export function outputRows(samples: readonly NetworkEvaluation[]): readonly ChartRow[] {
  return samples.map((sample) => ({ x: sample.x, value: sample.y }));
}
