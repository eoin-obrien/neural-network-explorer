import type { ActivationSelection } from '../activation/activation';
import { evaluateActivation } from '../activation/activation';
import { sourceValue } from './sourceValue';
import type { ExcludedUnitIds, HiddenUnit, NodeId, UnitEvaluation } from './types';

/**
 * Prince notation: z_i = theta_i0 + sum_j theta_ij h_{l-1,j}, then h_i = a[z_i].
 * For the first hidden layer the single source value is the scalar input x.
 */
export function evaluateHiddenUnit(
  unit: HiddenUnit,
  activation: ActivationSelection,
  sourceValues: ReadonlyMap<NodeId, number>,
  excludedUnitIds: ExcludedUnitIds,
): UnitEvaluation {
  const z = unit.incomingTheta.reduce(
    (sum, theta) => sum + theta.value * sourceValue(sourceValues, theta.sourceId),
    unit.thetaBias,
  );
  const h = evaluateActivation(activation, z);

  // Exclusion withholds the contribution, not the mathematics: z and h remain
  // the values this unit computes so its own charts stay truthful.
  return { unitId: unit.id, z, h, downstreamValue: excludedUnitIds.has(unit.id) ? 0 : h };
}
