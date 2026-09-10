import type { ExcludedUnitIds, Network, UnitId } from '../../domain/network/types';
import type { Preset } from '../presets/preset';
import type { ExplorerState, ScaleMode } from './explorerState';
import { initialExplorerState } from './explorerState';
import type { NetworkAction } from './updateNetwork';
import { updateNetwork } from './updateNetwork';

/** Interventions that leave every theta and phi exactly as they were. */
type ExplorationAction =
  | { readonly type: 'setProbeX'; readonly value: number }
  | { readonly type: 'setUnitExcluded'; readonly unitId: UnitId; readonly excluded: boolean }
  | { readonly type: 'setScaleMode'; readonly mode: ScaleMode }
  | { readonly type: 'selectPreset'; readonly preset: Preset }
  | { readonly type: 'reset' };

export type ExplorerAction = NetworkAction | ExplorationAction;

/**
 * The split between the two halves is the point: an action either edits the
 * canonical network or it does not. Forgetting to classify a new exploration
 * action fails to compile, because updateNetwork cannot accept it.
 */
export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  return isExplorationAction(action)
    ? updateExploration(state, action)
    : withNetwork(state, updateNetwork(state.network, action, state.preset.xDomain));
}

/**
 * Exploration state names units by id, so a network edit that retires a unit
 * must not leave an exclusion behind that nothing on screen can lift. Narrowing
 * the exclusions to units that still exist keeps that invariant in one place,
 * rather than asking every future network edit to remember it.
 */
function withNetwork(state: ExplorerState, network: Network): ExplorerState {
  const live = new Set(network.hiddenLayers.flatMap((layer) => layer.units.map((unit) => unit.id)));

  return {
    ...state,
    network,
    excludedUnitIds: new Set([...state.excludedUnitIds].filter((unitId) => live.has(unitId))),
  };
}

function isExplorationAction(action: ExplorerAction): action is ExplorationAction {
  return (
    action.type === 'reset' ||
    action.type === 'setProbeX' ||
    action.type === 'setUnitExcluded' ||
    action.type === 'setScaleMode' ||
    action.type === 'selectPreset'
  );
}

function updateExploration(state: ExplorerState, action: ExplorationAction): ExplorerState {
  switch (action.type) {
    // Reset and preset selection are the same operation: both start a fresh
    // exploration of some teaching network, one of which happens to be this one.
    case 'reset':
      return initialExplorerState(state.preset);
    case 'selectPreset':
      return initialExplorerState(action.preset);
    case 'setProbeX':
      return { ...state, probeX: action.value };
    case 'setScaleMode':
      return { ...state, scaleMode: action.mode };
    case 'setUnitExcluded':
      return {
        ...state,
        excludedUnitIds: withExclusion(state.excludedUnitIds, action.unitId, action.excluded),
      };
  }
}

function withExclusion(
  current: ExcludedUnitIds,
  unitId: UnitId,
  excluded: boolean,
): ExcludedUnitIds {
  const next = new Set(current);

  // The unit's parameters are untouched, so restoring it brings back whatever
  // values it holds now rather than the ones it had when it was excluded.
  if (excluded) {
    next.add(unitId);
  } else {
    next.delete(unitId);
  }

  return next;
}
