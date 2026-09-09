import type { ScaleMode } from '../../application/explorer/explorerState';
import type { FixedScale } from '../../application/presets/preset';
import type { LayerId, NetworkEvaluation } from '../../domain/network/types';
import type { LayerRanges } from '../../domain/range/networkRanges';
import { layerRanges, outputRange } from '../../domain/range/networkRanges';
import type { ValueRange } from '../../domain/range/reachableRange';

/**
 * Axis scaling is a stated policy, not a Recharts default, and it is a policy
 * about the value axis alone: both modes leave the original scalar x on the
 * horizontal axis, so one probe means one input at every stage of the pass.
 */
export function layerScale(
  mode: ScaleMode,
  fixedScale: FixedScale,
  samples: readonly NetworkEvaluation[],
  layerId: LayerId,
): LayerRanges {
  return mode === 'fixed' ? { z: fixedScale.z, h: fixedScale.h } : layerRanges(samples, layerId);
}

export function outputScale(
  mode: ScaleMode,
  fixedScale: FixedScale,
  samples: readonly NetworkEvaluation[],
): ValueRange {
  return mode === 'fixed' ? fixedScale.y : outputRange(samples);
}
