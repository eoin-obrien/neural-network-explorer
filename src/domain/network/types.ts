import type { ActivationSelection } from '../activation/activation';

/** Anything a connection can read from: the scalar input, or a hidden unit. */
export type NodeId = string;
export type LayerId = string;
export type UnitId = string;

// The scalar network input is the only source the first hidden layer reads, so
// it needs a node identity like any other connection source.
export const inputNodeId: NodeId = 'x';

interface IncomingTheta {
  readonly sourceId: NodeId;
  readonly value: number;
}

export interface HiddenUnit {
  readonly id: UnitId;
  readonly thetaBias: number;
  readonly incomingTheta: readonly IncomingTheta[];
}

export interface HiddenLayer {
  readonly id: LayerId;
  readonly units: readonly HiddenUnit[];
  readonly activation: ActivationSelection;
}

export interface OutputPhi {
  readonly sourceId: UnitId;
  readonly value: number;
}

export interface OutputLayer {
  readonly phi0: number;
  readonly incomingPhi: readonly OutputPhi[];
}

export interface Network {
  readonly hiddenLayers: readonly HiddenLayer[];
  readonly output: OutputLayer;
}

/**
 * Units withheld from the forward pass as a teaching intervention. Exclusion is
 * not a network parameter: an excluded unit keeps every theta it had.
 */
export type ExcludedUnitIds = ReadonlySet<UnitId>;

export interface UnitEvaluation {
  readonly unitId: UnitId;
  readonly z: number;
  readonly h: number;
  /** h, or zero while the unit is excluded: what the next layer actually reads. */
  readonly downstreamValue: number;
}

export interface LayerEvaluation {
  readonly layerId: LayerId;
  readonly units: readonly UnitEvaluation[];
}

export interface NetworkEvaluation {
  readonly x: number;
  readonly layers: readonly LayerEvaluation[];
  readonly y: number;
}

/** Closed interval of scalar inputs a teaching view samples and probes. */
export type XDomain = readonly [min: number, max: number];
