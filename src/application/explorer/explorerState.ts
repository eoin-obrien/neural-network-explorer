import type { ExcludedUnitIds, Network } from '../../domain/network/types';
import type { Preset } from '../presets/preset';

/** Display order for the scale control. */
export const scaleModes = ['fixed', 'reachable'] as const;

/**
 * Which policy chooses a chart's value axis: the preset's fixed teaching scale,
 * or the values the network actually reaches over the sampled input domain.
 * Either way the horizontal axis stays the original scalar x.
 */
export type ScaleMode = (typeof scaleModes)[number];

/**
 * The canonical network, plus the exploration state it is inspected with.
 * The two stay separate: excluding a unit, moving the probe or rescaling an
 * axis is a teaching intervention, never a change to the network's parameters.
 */
export interface ExplorerState {
  readonly network: Network;
  readonly probeX: number;
  readonly excludedUnitIds: ExcludedUnitIds;
  readonly scaleMode: ScaleMode;
}

export function initialExplorerState(preset: Preset): ExplorerState {
  const [min, max] = preset.xDomain;

  return {
    network: preset.network,
    probeX: (min + max) / 2,
    excludedUnitIds: new Set(),
    // The stable axis is the teaching default: a learner moving a slider should
    // see the curve move rather than the axis move underneath it.
    scaleMode: 'fixed',
  };
}

/**
 * A segmented control hands back a plain string. Narrowing it here keeps the
 * caller total, exactly as activationSelectionFor does for activations: an
 * unrecognized value yields no mode rather than an unchecked assertion.
 */
export function scaleModeFor(value: string): readonly ScaleMode[] {
  return scaleModes.filter((mode) => mode === value);
}
