import type {
  HiddenLayer,
  HiddenUnit,
  LayerId,
  Network,
  NodeId,
  OutputLayer,
  UnitId,
} from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';

/**
 * A hidden layer always keeps at least one unit. A layer with none has no
 * mathematics left to show, and it would empty the output sum without the
 * learner having excluded anything.
 */
export const minLayerWidth = 1;

// A unit arrives as a hinge through the origin — no bias, every incoming weight
// 1 — with a modest output weight, so the capacity that was just added is
// visible without swamping the function already on screen.
//
// Fixed rather than random: the same click on the same network must always
// produce the same network, exactly as evaluation and sampling are deterministic.
const addedThetaBias = 0;
const addedTheta = 1;
const addedPhi = 0.5;

/**
 * Width is a property of the network, so widening a layer writes parameters: the
 * new unit brings its own theta, and whatever reads that layer gains the
 * connection that reads it — a phi when the layer is last, otherwise a theta on
 * every unit of the layer above.
 */
export function addUnit(network: Network, layerId: LayerId): Network {
  return positionsOf(network, layerId).reduce(
    (current, { index }) => withUnitAdded(current, index),
    network,
  );
}

/**
 * The last unit of the layer goes, together with the connection that read it.
 * A layer already at its minimum width is returned untouched.
 */
export function removeUnit(network: Network, layerId: LayerId): Network {
  return (
    positionsOf(network, layerId)
      .filter(({ layer }) => layer.units.length > minLayerWidth)
      // Sliced rather than indexed, so an empty layer yields nothing to remove
      // instead of an absent id.
      .flatMap(({ layer, index }) => layer.units.slice(-1).map((unit) => ({ index, unit })))
      .reduce((current, { index, unit }) => withUnitRemoved(current, index, unit.id), network)
  );
}

// Selected by id and carrying its position: a layer that is not in this network
// yields no position, so an unknown id changes nothing rather than throwing.
function positionsOf(
  network: Network,
  layerId: LayerId,
): readonly { readonly layer: HiddenLayer; readonly index: number }[] {
  return network.hiddenLayers
    .map((layer, index) => ({ layer, index }))
    .filter(({ layer }) => layer.id === layerId);
}

function withUnitAdded(network: Network, targetIndex: number): Network {
  const unit = newUnitFor(network, targetIndex);

  return {
    hiddenLayers: network.hiddenLayers.map((layer, index) =>
      layerAfterAdd(layer, index, targetIndex, unit),
    ),
    output: isLastLayer(network, targetIndex)
      ? { ...network.output, incomingPhi: [...network.output.incomingPhi, phiFor(unit.id)] }
      : network.output,
  };
}

function withUnitRemoved(network: Network, targetIndex: number, unitId: UnitId): Network {
  return {
    hiddenLayers: network.hiddenLayers.map((layer, index) =>
      layerAfterRemove(layer, index, targetIndex, unitId),
    ),
    output: isLastLayer(network, targetIndex)
      ? withoutSource(network.output, unitId)
      : network.output,
  };
}

function layerAfterAdd(
  layer: HiddenLayer,
  index: number,
  targetIndex: number,
  unit: HiddenUnit,
): HiddenLayer {
  if (index === targetIndex) {
    return { ...layer, units: [...layer.units, unit] };
  }

  // The layer above now has one more activation to read.
  if (index === targetIndex + 1) {
    return {
      ...layer,
      units: layer.units.map((above) => ({
        ...above,
        incomingTheta: [...above.incomingTheta, { sourceId: unit.id, value: addedTheta }],
      })),
    };
  }

  return layer;
}

function layerAfterRemove(
  layer: HiddenLayer,
  index: number,
  targetIndex: number,
  unitId: UnitId,
): HiddenLayer {
  if (index === targetIndex) {
    return { ...layer, units: layer.units.filter((unit) => unit.id !== unitId) };
  }

  // A connection may not name a source that no longer exists: the forward pass
  // throws on one rather than reading it as zero.
  if (index === targetIndex + 1) {
    return {
      ...layer,
      units: layer.units.map((above) => ({
        ...above,
        incomingTheta: above.incomingTheta.filter((theta) => theta.sourceId !== unitId),
      })),
    };
  }

  return layer;
}

function newUnitFor(network: Network, targetIndex: number): HiddenUnit {
  return {
    id: freshUnitId(network, targetIndex),
    thetaBias: addedThetaBias,
    incomingTheta: sourceIdsFor(network, targetIndex).map((sourceId) => ({
      sourceId,
      value: addedTheta,
    })),
  };
}

// The first hidden layer reads the scalar input; a deeper one reads the
// activations of the layer below it. Mirrors how the unit cards name the same
// sources, so a new unit's sliders read the way its neighbours' do.
function sourceIdsFor(network: Network, layerIndex: number): readonly NodeId[] {
  const below = network.hiddenLayers.filter((_, index) => index === layerIndex - 1);

  return below.length === 0
    ? [inputNodeId]
    : below.flatMap((layer) => layer.units.map((u) => u.id));
}

/**
 * An id no unit in the network currently holds. Ids may be reused once a
 * removal has retired one: the reducer prunes exploration state naming a unit
 * that has gone, so nothing outlives an identity.
 */
function freshUnitId(network: Network, layerIndex: number): UnitId {
  const taken = new Set(network.hiddenLayers.flatMap((layer) => layer.units.map((u) => u.id)));
  const layerNumber = layerIndex + 1;
  const idFor = (n: number): UnitId => `l${String(layerNumber)}-u${String(n)}`;

  // At most `taken.size` of these can collide, so the lowest free number is
  // always among the first `taken.size + 1`.
  const lowestFree = Array.from({ length: taken.size + 1 }, (_, index) => index + 1)
    .filter((n) => !taken.has(idFor(n)))
    .reduce((lowest, n) => Math.min(lowest, n), taken.size + 1);

  return idFor(lowestFree);
}

function isLastLayer(network: Network, layerIndex: number): boolean {
  return layerIndex === network.hiddenLayers.length - 1;
}

function phiFor(unitId: UnitId): { readonly sourceId: UnitId; readonly value: number } {
  return { sourceId: unitId, value: addedPhi };
}

function withoutSource(output: OutputLayer, unitId: UnitId): OutputLayer {
  return { ...output, incomingPhi: output.incomingPhi.filter((phi) => phi.sourceId !== unitId) };
}
