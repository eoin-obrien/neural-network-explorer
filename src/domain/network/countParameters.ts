import type { Network } from './types';

/**
 * Trainable network parameters: every theta and every phi, and nothing else.
 * Activation configuration such as leaky ReLU's alpha is not a network
 * parameter. For a dense 1 -> n -> 1 network this is 3n + 1, so the default
 * 1 -> 3 -> 1 preset has 10.
 */
export function countParameters(network: Network): number {
  const theta = network.hiddenLayers.reduce(
    (total, layer) =>
      total + layer.units.reduce((count, unit) => count + 1 + unit.incomingTheta.length, 0),
    0,
  );

  return theta + 1 + network.output.incomingPhi.length;
}
