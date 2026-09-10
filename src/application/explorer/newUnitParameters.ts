import type { XDomain } from '../../domain/network/types';

/**
 * Where a new unit sits, which is what decides how its parameters are chosen.
 * A unit reading the scalar input can be given a hinge at a known x; one
 * reading a layer below has no single input to place a hinge against.
 */
export type UnitPlacement =
  | {
      readonly reads: 'input';
      readonly xDomain: XDomain;
      /** Which unit of its layer this is, counting from zero. */
      readonly ordinal: number;
    }
  | { readonly reads: 'layer'; readonly sources: number };

/** Parameters for a unit about to join a layer, in the order its sources are. */
export interface DrawnUnit {
  readonly thetaBias: number;
  readonly theta: readonly number[];
  readonly phi: number;
}

// Values land on the grid the sliders move in, so a generated parameter looks
// like one a learner could have dialled in rather than a number with a tail.
//
// The control's own step lives in presentation, which the application must not
// import, so the two agree by a test on the presentation side rather than by
// sharing a constant.
const valueStep = 0.05;

// A slope below this is a nearly flat unit whose hinge is invisible; above it
// the unit dominates every other curve in the layer.
const minSlope = 0.8;
const maxSlope = 2.5;

// The hinge is placed this far inside the sampled domain at the closest, so it
// never lands against a plot edge where the bend cannot be seen.
const hingeInset = 0.15;

// Successive hinges step through the domain by an additive golden-ratio
// recurrence rather than being drawn independently. Independent draws cluster,
// and three units bending at almost the same x say nothing that one of them
// does not; this drops each new hinge into the widest gap the others left.
const goldenFraction = 0.618033988749895;

// A deeper unit mixes activations rather than the input, so its weights stay
// nearer 1: the layer below already carries the scale.
const minWeight = 0.5;
const maxWeight = 1.5;
const maxDeepBias = 0.8;
const minDeepPhi = 0.4;
const maxDeepPhi = 1.1;

/*
 * The most a new unit may move y anywhere in the sampled domain.
 *
 * phi is solved from this rather than drawn. A drawn phi multiplies whatever
 * slope and hinge the unit happened to get, and the product runs over an order
 * of magnitude: one unit swings y by five while the next does nothing visible.
 * Fixing the peak instead makes every addition move the curve by the same
 * amount, so the shape folds once more each time and eight units still sit
 * inside the teaching scale.
 */
const peakContribution = 0.7;

/**
 * Parameters drawn deterministically from where the unit sits, so successive
 * additions differ from one another: each new unit bends the output somewhere
 * new instead of scaling a hinge that is already there.
 *
 * Deterministic rather than random. The same click on the same network always
 * produces the same unit, so a lesson repeats exactly and a test can assert
 * values rather than ranges.
 */
export function drawUnit(seed: number, placement: UnitPlacement): DrawnUnit {
  return placement.reads === 'input'
    ? inputUnit(seed, placement.xDomain, placement.ordinal)
    : deepUnit(seed, placement.sources);
}

function inputUnit(seed: number, xDomain: XDomain, ordinal: number): DrawnUnit {
  /*
   * A ReLU unit is active on one side of its hinge only, and which side is the
   * sign of theta1. Alternating that with the ordinal keeps the two sides evenly
   * populated, so the far ends of the plot are not carried by every unit at once.
   */
  const facing = ordinal % 2 === 0 ? 1 : -1;
  const slope = onGrid(facing * draw(seed, 1, minSlope, maxSlope));
  const hinge = within(xDomain, hingeInset + spread(ordinal) * (1 - 2 * hingeInset));

  /*
   * Consecutive units bend y in opposite directions, so each addition folds the
   * function once more rather than tilting it further. It alternates every
   * second ordinal because every second ordinal is what shares a side: the units
   * stacking on the same stretch of x are the ones that have to cancel.
   */
  const direction = Math.floor(ordinal / 2) % 2 === 0 ? 1 : -1;

  // How far the active side of this unit runs before the plot ends. The hinge is
  // inset from both edges, so there is always some of it.
  const reach = facing > 0 ? xDomain[1] - hinge : hinge - xDomain[0];

  // z is zero where theta0 + theta1 x is, so this puts the unit's kink at the
  // chosen x: the hinge a ReLU shows is exactly there.
  return {
    thetaBias: onGrid(-slope * hinge),
    theta: [slope],
    // The unit reaches phi theta1 reach at the far edge, and that is the peak.
    phi: onGrid((direction * peakContribution) / (Math.abs(slope) * reach)),
  };
}

function deepUnit(seed: number, sources: number): DrawnUnit {
  return {
    thetaBias: onGrid(signedDraw(seed, 1, 0, maxDeepBias)),
    theta: Array.from({ length: sources }, (_, index) =>
      onGrid(signedDraw(seed, index + 4, minWeight, maxWeight)),
    ),
    // A deeper unit's activation is already bounded by the layer below, so its
    // output weight is drawn directly rather than solved from a slope it has no
    // single input to have a slope against.
    phi: onGrid(signedDraw(seed, 3, minDeepPhi, maxDeepPhi)),
  };
}

/** Where in the domain this unit's hinge belongs, as a fraction of its width. */
function spread(ordinal: number): number {
  return (ordinal * goldenFraction) % 1;
}

/** A value in the interval, drawn from this seed's stream. */
function draw(seed: number, stream: number, min: number, max: number): number {
  return min + unitInterval(hash(seed, stream)) * (max - min);
}

/** The same, with the sign drawn separately so both directions occur. */
function signedDraw(seed: number, stream: number, min: number, max: number): number {
  const magnitude = draw(seed, stream, min, max);

  return unitInterval(hash(seed, -stream)) < 0.5 ? -magnitude : magnitude;
}

/** The point this far along the domain, as a fraction of its width. */
function within([min, max]: XDomain, fraction: number): number {
  return min + fraction * (max - min);
}

function onGrid(value: number): number {
  return Math.round(value / valueStep) * valueStep;
}

// A cheap avalanche hash. Not cryptographic and does not need to be: it only
// has to spread consecutive seeds across the interval so that unit four does
// not look like unit three.
function hash(seed: number, stream: number): number {
  const mixed = Math.imul(seed * 0x9e37 + stream, 0x85ebca6b) >>> 0;

  return Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35) >>> 0;
}

function unitInterval(value: number): number {
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}
