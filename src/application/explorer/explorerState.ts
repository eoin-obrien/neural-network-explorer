import type { ExcludedUnitIds, Network } from '../../domain/network/types';
import type { Preset } from '../presets/preset';

/**
 * The canonical network, plus the exploration state it is inspected with.
 * The two stay separate: excluding a unit or moving the probe is a teaching
 * intervention, never a change to the network's parameters.
 */
export interface ExplorerState {
  readonly network: Network;
  readonly probeX: number;
  readonly excludedUnitIds: ExcludedUnitIds;
}

export function initialExplorerState(preset: Preset): ExplorerState {
  const [min, max] = preset.xDomain;

  return { network: preset.network, probeX: (min + max) / 2, excludedUnitIds: new Set() };
}
