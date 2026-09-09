import { evaluateHiddenUnit } from './evaluateHiddenUnit';
import type { ExcludedUnitIds, HiddenLayer, LayerEvaluation, NodeId } from './types';

export function evaluateHiddenLayer(
  layer: HiddenLayer,
  sourceValues: ReadonlyMap<NodeId, number>,
  excludedUnitIds: ExcludedUnitIds,
): LayerEvaluation {
  return {
    layerId: layer.id,
    // Activation is a property of the layer, so every unit in it uses the same
    // a[.] and no caller ever branches on an activation id.
    units: layer.units.map((unit) =>
      evaluateHiddenUnit(unit, layer.activation, sourceValues, excludedUnitIds),
    ),
  };
}
