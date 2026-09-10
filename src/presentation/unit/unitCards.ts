import type {
  HiddenLayer,
  HiddenUnit,
  LayerId,
  Network,
  NodeId,
  OutputPhi,
  UnitId,
} from '../../domain/network/types';
import { inputNodeId } from '../../domain/network/types';
import { activationSymbol, subscript, unitIndices } from '../notation/notation';

interface ParameterControl {
  readonly symbol: string;
  readonly description: string;
  readonly value: number;
}

interface ThetaControl extends ParameterControl {
  readonly sourceId: NodeId;
}

export interface UnitCardModel {
  readonly unitId: UnitId;
  /** Display index within its layer; the id is what carries identity. */
  readonly number: number;
  /** What the card is called: a deeper network has more than one neuron 1. */
  readonly title: string;
  readonly thetaBias: ParameterControl;
  readonly theta: readonly ThetaControl[];
  /** The output connections reading this unit: empty for a unit deeper in. */
  readonly phi: readonly OutputPhi[];
  readonly zEquation: string;
  readonly hEquation: string;
}

export interface LayerCardsModel {
  readonly layerId: LayerId;
  readonly number: number;
  readonly cards: readonly UnitCardModel[];
}

interface SourceSymbol {
  readonly id: NodeId;
  /** The j in theta_ij. */
  readonly index: number;
  readonly symbol: string;
  readonly description: string;
}

// Prince writes the scalar-input weight as theta_i1, so the input takes index 1
// exactly as the first unit of a previous layer would.
const inputSource: SourceSymbol = {
  id: inputNodeId,
  index: 1,
  symbol: 'x',
  description: 'slope',
};

/**
 * Everything the unit strip needs to draw itself, derived from the network
 * rather than assumed: any width and any depth produce the matching cards.
 */
export function layerCards(network: Network): readonly LayerCardsModel[] {
  return network.hiddenLayers.map((layer, layerIndex) => ({
    layerId: layer.id,
    number: layerIndex + 1,
    cards: layer.units.map((unit, unitIndex) =>
      unitCard(
        unit,
        {
          number: unitIndex + 1,
          title: cardTitle(layerIndex + 1, unitIndex + 1, network.hiddenLayers.length),
          indices: unitIndices(layerIndex + 1, unitIndex + 1, network.hiddenLayers.length),
          sources: sourcesFor(network, layerIndex),
        },
        network.output.incomingPhi,
      ),
    ),
  }));
}

function cardTitle(layerNumber: number, unitNumber: number, layerCount: number): string {
  return layerCount > 1
    ? `Layer ${String(layerNumber)} neuron ${String(unitNumber)}`
    : `Neuron ${String(unitNumber)}`;
}

function sourcesFor(network: Network, layerIndex: number): readonly SourceSymbol[] {
  const previous = network.hiddenLayers.filter((_, index) => index === layerIndex - 1);

  // The first hidden layer reads the scalar input; later layers read the
  // activations of the layer before them. The previous layer sits at
  // layerIndex - 1, so its layer number is layerIndex.
  return previous.length === 0
    ? [inputSource]
    : previous.flatMap((layer) => layerSources(layer, layerIndex, network.hiddenLayers.length));
}

function layerSources(
  layer: HiddenLayer,
  layerNumber: number,
  layerCount: number,
): readonly SourceSymbol[] {
  return layer.units.map((unit, position) => {
    // Named as the card that owns it names it: h₁₂, not the h₂ a reader would
    // otherwise have to guess belonged to the layer before this one.
    const symbol = activationSymbol(layerNumber, position + 1, layerCount);

    return { id: unit.id, index: position + 1, symbol, description: `weight on ${symbol}` };
  });
}

/** Where a unit sits, and what it reads: everything its symbols are built from. */
interface UnitPosition {
  /** Display index within its own layer, and the i in phi_i. */
  readonly number: number;
  readonly title: string;
  /** Subscript indices up to the unit itself: [unit], or [layer, unit] with depth. */
  readonly indices: readonly number[];
  readonly sources: readonly SourceSymbol[];
}

function unitCard(
  unit: HiddenUnit,
  position: UnitPosition,
  incomingPhi: readonly OutputPhi[],
): UnitCardModel {
  const wired = position.sources.flatMap((source) =>
    unit.incomingTheta
      .filter((incoming) => incoming.sourceId === source.id)
      .map((incoming) => ({ source, value: incoming.value })),
  );

  const index = subscript(position.indices);
  // theta_i0 is the bias; the j of theta_ij is the source's position.
  const bias = thetaSymbol(position.indices, 0);
  const terms = wired.map(
    ({ source }) => ` + ${thetaSymbol(position.indices, source.index)}${source.symbol}`,
  );

  return {
    unitId: unit.id,
    number: position.number,
    title: position.title,
    thetaBias: { symbol: bias, description: 'intercept', value: unit.thetaBias },
    theta: wired.map(({ source, value }) => ({
      symbol: thetaSymbol(position.indices, source.index),
      description: source.description,
      sourceId: source.id,
      value,
    })),
    phi: incomingPhi.filter((phi) => phi.sourceId === unit.id),
    zEquation: `z${index} = ${bias}${terms.join('')}`,
    hEquation: `h${index} = a[z${index}]`,
  };
}

function thetaSymbol(indices: readonly number[], sourceIndex: number): string {
  return `θ${subscript([...indices, sourceIndex])}`;
}
