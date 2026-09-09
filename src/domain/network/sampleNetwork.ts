import { evaluateNetwork } from './evaluateNetwork';
import type { ExcludedUnitIds, Network, NetworkEvaluation, XDomain } from './types';

/**
 * One shared set of x positions backs every function plot, so the same probe
 * means the same input in z_li(x), h_li(x), and y(x) alike. The count is
 * declared once here rather than per chart.
 */
const sampleCount = 161;

export function sampleNetwork(
  network: Network,
  xDomain: XDomain,
  excludedUnitIds: ExcludedUnitIds,
): readonly NetworkEvaluation[] {
  return sampleX(xDomain).map((x) => evaluateNetwork(network, x, excludedUnitIds));
}

function sampleX([min, max]: XDomain): readonly number[] {
  const step = (max - min) / (sampleCount - 1);

  // The final sample is max itself rather than min + step * (n - 1): the
  // endpoint must be exact, not the accumulation of a repeated division.
  return Array.from({ length: sampleCount }, (_, index) =>
    index === sampleCount - 1 ? max : min + index * step,
  );
}
