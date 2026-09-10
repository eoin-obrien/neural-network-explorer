import type { ActivationSelection } from '../../domain/activation/activation';
import type {
  HiddenLayer,
  HiddenUnit,
  LayerId,
  Network,
  NodeId,
  UnitId,
  XDomain,
} from '../../domain/network/types';
import { addUnit, removeUnit } from './resizeLayer';

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
  | { readonly type: 'setActivation'; readonly selection: ActivationSelection }
  // Widening a layer writes parameters rather than intervening in the pass, so
  // it belongs here beside the sliders and not among the exploration actions.
  | { readonly type: 'addUnit'; readonly layerId: LayerId }
  | { readonly type: 'removeUnit'; readonly layerId: LayerId };

type ThetaAction = Extract<NetworkAction, { type: 'setThetaBias' | 'setTheta' }>;

/**
 * The input domain reaches this far because a new unit's parameters are chosen
 * to put its hinge somewhere visible within it. No other edit consults it.
 */
export function updateNetwork(network: Network, action: NetworkAction, xDomain: XDomain): Network {
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
    case 'addUnit':
      return addUnit(network, action.layerId, xDomain);
    case 'removeUnit':
      return removeUnit(network, action.layerId);
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
