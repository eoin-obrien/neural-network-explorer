import { expect, test } from 'vitest';

import { explorerReducer } from '../../application/explorer/explorerReducer';
import type { ExplorerState } from '../../application/explorer/explorerState';
import { initialExplorerState } from '../../application/explorer/explorerState';
import { defaultShallowPreset } from '../../application/presets/defaultShallow';
import { twoLayerPreset } from '../../application/presets/twoLayer';
import type { Preset } from '../../application/presets/preset';
import type { ControlRange } from './parameterRanges';
import { parameterStep, phiRange, thetaBiasRange, thetaWeightRange } from './parameterRanges';

/*
 * A unit the application adds arrives with parameters it chose, and those
 * parameters land on these sliders. The two halves agree by construction rather
 * than by coincidence, so this is where that is checked: the application cannot
 * import the controls, and a value outside a slider's range would be a
 * parameter a learner could see but never restore after moving it.
 */
function widen(preset: Preset, layerId: string, times: number): ExplorerState {
  return Array.from({ length: times }).reduce<ExplorerState>(
    (state) => explorerReducer(state, { type: 'addUnit', layerId }),
    initialExplorerState(preset),
  );
}

function onGrid(value: number): boolean {
  return Math.abs(value / parameterStep - Math.round(value / parameterStep)) < 1e-9;
}

function within(value: number, range: ControlRange): boolean {
  return value >= range.min && value <= range.max;
}

test('an added unit sits on the grid its sliders move in', () => {
  const network = widen(defaultShallowPreset, 'hidden-1', 5).network;

  for (const unit of network.hiddenLayers.at(0)?.units ?? []) {
    expect(onGrid(unit.thetaBias)).toBe(true);

    for (const theta of unit.incomingTheta) {
      expect(onGrid(theta.value)).toBe(true);
    }
  }

  for (const phi of network.output.incomingPhi) {
    expect(onGrid(phi.value)).toBe(true);
  }
});

test('an added unit stays inside the ranges its sliders offer', () => {
  const network = widen(defaultShallowPreset, 'hidden-1', 5).network;

  for (const unit of network.hiddenLayers.at(0)?.units ?? []) {
    expect(within(unit.thetaBias, thetaBiasRange)).toBe(true);

    for (const theta of unit.incomingTheta) {
      expect(within(theta.value, thetaWeightRange)).toBe(true);
    }
  }

  for (const phi of network.output.incomingPhi) {
    expect(within(phi.value, phiRange)).toBe(true);
  }
});

test('a unit added to a deeper layer stays inside them too', () => {
  const network = widen(twoLayerPreset, 'hidden-2', 3).network;

  for (const unit of network.hiddenLayers.at(1)?.units ?? []) {
    expect(within(unit.thetaBias, thetaBiasRange)).toBe(true);
    expect(onGrid(unit.thetaBias)).toBe(true);

    for (const theta of unit.incomingTheta) {
      expect(within(theta.value, thetaWeightRange)).toBe(true);
      expect(onGrid(theta.value)).toBe(true);
    }
  }

  for (const phi of network.output.incomingPhi) {
    expect(within(phi.value, phiRange)).toBe(true);
  }
});
