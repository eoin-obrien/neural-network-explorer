import { evaluateHiddenLayer } from './evaluateHiddenLayer';
import { outputContributions, sumContributions } from './outputContributions';
import type {
  ExcludedUnitIds,
  HiddenLayer,
  LayerEvaluation,
  Network,
  NetworkEvaluation,
  NodeId,
} from './types';
import { inputNodeId } from './types';

interface ForwardPass {
  readonly layers: readonly LayerEvaluation[];
  readonly sourceValues: ReadonlyMap<NodeId, number>;
}

/**
 * The whole forward pass, retaining every intermediate value:
 *
 *   previous h -> theta-weighted affine sum -> z -> a[z] -> h -> next layer
 *                                                             -> phi-weighted y
 */
export function evaluateNetwork(
  network: Network,
  x: number,
  excludedUnitIds: ExcludedUnitIds,
): NetworkEvaluation {
  // h_0 = x: for a scalar-input network the input node is the first layer's
  // only source value.
  const start: ForwardPass = { layers: [], sourceValues: new Map([[inputNodeId, x]]) };

  const { layers, sourceValues } = network.hiddenLayers.reduce(
    (pass, layer) => advance(pass, layer, excludedUnitIds),
    start,
  );

  const contributions = outputContributions(network.output, sourceValues);

  return { x, layers, contributions, y: sumContributions(network.output.phi0, contributions) };
}

function advance(
  pass: ForwardPass,
  layer: HiddenLayer,
  excludedUnitIds: ExcludedUnitIds,
): ForwardPass {
  const evaluation = evaluateHiddenLayer(layer, pass.sourceValues, excludedUnitIds);

  return {
    layers: [...pass.layers, evaluation],
    // The next layer reads h, never z, and reads it through the exclusion
    // intervention so an exclusion propagates through any remaining depth.
    sourceValues: new Map(evaluation.units.map((unit) => [unit.unitId, unit.downstreamValue])),
  };
}
