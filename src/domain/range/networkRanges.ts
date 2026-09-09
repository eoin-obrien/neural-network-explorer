import type { LayerId, NetworkEvaluation, UnitEvaluation } from '../network/types';
import type { ValueRange } from './reachableRange';
import { reachableRange } from './reachableRange';

/** The value ranges a layer's two plotted stages reach over the sampled input. */
export interface LayerRanges {
  readonly z: ValueRange;
  readonly h: ValueRange;
}

/**
 * One z range and one h range for the whole layer, so the unit cards standing
 * beside each other stay directly comparable. The two are separate because the
 * activation changes what is reachable: z may run to +/-3 where a sigmoid h is
 * bounded to [0, 1].
 *
 * An excluded unit still plots its own z and h, so its values still belong to
 * the shared range: exclusion withholds a contribution from y, not a curve.
 */
export function layerRanges(samples: readonly NetworkEvaluation[], layerId: LayerId): LayerRanges {
  const units = unitsIn(samples, layerId);

  return {
    z: reachableRange(units.map((unit) => unit.z)),
    h: reachableRange(units.map((unit) => unit.h)),
  };
}

/** The range y reaches. The output chart compares against nothing but itself. */
export function outputRange(samples: readonly NetworkEvaluation[]): ValueRange {
  return reachableRange(samples.map((sample) => sample.y));
}

// Selected by id rather than by position, and filtered rather than found: a
// layer that is not in these samples contributes nothing instead of throwing.
function unitsIn(
  samples: readonly NetworkEvaluation[],
  layerId: LayerId,
): readonly UnitEvaluation[] {
  return samples.flatMap((sample) =>
    sample.layers.filter((layer) => layer.layerId === layerId).flatMap((layer) => layer.units),
  );
}
