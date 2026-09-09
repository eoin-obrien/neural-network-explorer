import type { ActivationSelection } from '../../domain/activation/activation';
import type { HiddenLayer, HiddenUnit, Network, NodeId, UnitId } from '../../domain/network/types';

/** Edits to the canonical network: every one of these changes a theta or a phi. */
export type NetworkAction =
  | { readonly type: 'setThetaBias'; readonly unitId: UnitId; readonly value: number }
  | {
      readonly type: 'setTheta';
      readonly unitId: UnitId;
      readonly sourceId: NodeId;
      readonly value: number;
    }
  | { readonly type: 'setPhi'; readonly sourceId: UnitId; readonly value: number }
  | { readonly type: 'setPhi0'; readonly value: number }
  | { readonly type: 'setActivation'; readonly selection: ActivationSelection };

type ThetaAction = Extract<NetworkAction, { type: 'setThetaBias' | 'setTheta' }>;

export function updateNetwork(network: Network, action: NetworkAction): Network {
  switch (action.type) {
    case 'setThetaBias':
    case 'setTheta':
      return { ...network, hiddenLayers: network.hiddenLayers.map((l) => updateLayer(l, action)) };
    case 'setActivation':
      // The initial view offers one activation for the whole network, but each
      // layer still owns its own selection.
      return {
        ...network,
        hiddenLayers: network.hiddenLayers.map((layer) => ({
          ...layer,
          activation: action.selection,
        })),
      };
    case 'setPhi':
      return {
        ...network,
        output: {
          ...network.output,
          incomingPhi: network.output.incomingPhi.map((phi) =>
            phi.sourceId === action.sourceId ? { ...phi, value: action.value } : phi,
          ),
        },
      };
    case 'setPhi0':
      return { ...network, output: { ...network.output, phi0: action.value } };
  }
}

function updateLayer(layer: HiddenLayer, action: ThetaAction): HiddenLayer {
  return {
    ...layer,
    units: layer.units.map((unit) => (unit.id === action.unitId ? updateUnit(unit, action) : unit)),
  };
}

function updateUnit(unit: HiddenUnit, action: ThetaAction): HiddenUnit {
  if (action.type === 'setThetaBias') {
    return { ...unit, thetaBias: action.value };
  }

  return {
    ...unit,
    incomingTheta: unit.incomingTheta.map((theta) =>
      theta.sourceId === action.sourceId ? { ...theta, value: action.value } : theta,
    ),
  };
}
