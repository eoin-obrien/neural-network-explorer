import { sourceValue } from './sourceValue';
import type { OutputContribution, OutputLayer, UnitId } from './types';

/**
 * The terms of y = phi_0 + sum_i phi_i h_i, kept separately from their sum so a
 * teaching view can show what each unit puts into the output.
 *
 * An excluded unit's downstream value is zero, so its term goes to zero rather
 * than its phi being rewritten: the intervention is visible in the sum, and the
 * parameter it would contribute with is still there when it returns.
 */
export function outputContributions(
  output: OutputLayer,
  sourceValues: ReadonlyMap<UnitId, number>,
): readonly OutputContribution[] {
  return output.incomingPhi.map((phi) => ({
    sourceId: phi.sourceId,
    value: phi.value * sourceValue(sourceValues, phi.sourceId),
  }));
}

/** Prince notation: y = phi_0 + sum_i phi_i h_i. The output layer uses phi. */
export function sumContributions(
  phi0: number,
  contributions: readonly OutputContribution[],
): number {
  return contributions.reduce((sum, term) => sum + term.value, phi0);
}
