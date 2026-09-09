import { sourceValue } from './sourceValue';
import type { OutputLayer, UnitId } from './types';

/** Prince notation: y = phi_0 + sum_i phi_i h_i. The output layer uses phi, not theta. */
export function evaluateOutputLayer(
  output: OutputLayer,
  sourceValues: ReadonlyMap<UnitId, number>,
): number {
  return output.incomingPhi.reduce(
    (sum, phi) => sum + phi.value * sourceValue(sourceValues, phi.sourceId),
    output.phi0,
  );
}
