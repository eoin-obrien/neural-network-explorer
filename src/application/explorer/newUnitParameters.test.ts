import { expect, test } from 'vitest';

import { evaluateNetwork } from '../../domain/network/evaluateNetwork';
import type { Network, XDomain } from '../../domain/network/types';
import { sampleNetwork } from '../../domain/network/sampleNetwork';
import { defaultShallowPreset } from '../presets/defaultShallow';
import { explorerReducer } from './explorerReducer';
import type { ExplorerState } from './explorerState';
import { initialExplorerState } from './explorerState';
import { drawUnit } from './newUnitParameters';

const xDomain: XDomain = [-1, 1];

function widen(times: number): ExplorerState {
  return Array.from({ length: times }).reduce<ExplorerState>(
    (state) => explorerReducer(state, { type: 'addUnit', layerId: 'hidden-1' }),
    initialExplorerState(defaultShallowPreset),
  );
}

/** Every unit the first hidden layer holds, with the phi that reads it. */
function unitsOf(network: Network): readonly { hinge: number; peak: number; step: number }[] {
  return (network.hiddenLayers.at(0)?.units ?? []).map((unit) => {
    const slope = unit.incomingTheta.at(0)?.value ?? 0;
    const phi = network.output.incomingPhi.find((p) => p.sourceId === unit.id)?.value ?? 0;
    const hinge = -unit.thetaBias / slope;
    const reach = slope > 0 ? xDomain[1] - hinge : hinge - xDomain[0];

    return { hinge, peak: Math.abs(phi * slope * reach), step: phi * slope };
  });
}

test('the same placement always draws the same unit', () => {
  expect(drawUnit(4, { reads: 'input', xDomain, ordinal: 4 })).toStrictEqual(
    drawUnit(4, { reads: 'input', xDomain, ordinal: 4 }),
  );
  expect(widen(3).network).toStrictEqual(widen(3).network);
});

test('successive units differ from one another', () => {
  const drawn = [3, 4, 5, 6, 7].map((ordinal) =>
    drawUnit(ordinal, { reads: 'input', xDomain, ordinal }),
  );

  expect(new Set(drawn.map((unit) => JSON.stringify(unit))).size).toBe(drawn.length);
});

test('every hinge lands inside the sampled domain, clear of both edges', () => {
  for (const { hinge } of unitsOf(widen(5).network).slice(3)) {
    expect(hinge).toBeGreaterThan(xDomain[0]);
    expect(hinge).toBeLessThan(xDomain[1]);
  }
});

test('the hinges spread out rather than clustering', () => {
  const hinges = unitsOf(widen(5).network)
    .slice(3)
    .map(({ hinge }) => hinge)
    .sort((a, b) => a - b);

  // Five units across a domain of width two cannot be spread if any two sit on
  // top of each other. An independent draw clusters; this one steps.
  const gaps = hinges.slice(1).map((hinge, index) => hinge - (hinges[index] ?? 0));

  for (const gap of gaps) {
    expect(gap).toBeGreaterThan(0.1);
  }
});

test('each added unit moves the output by about the same amount', () => {
  const peaks = unitsOf(widen(5).network)
    .slice(3)
    .map(({ peak }) => peak);

  // Solved from a fixed peak rather than drawn, so no unit is invisible beside
  // another. Tolerance covers rounding phi onto the slider grid.
  for (const peak of peaks) {
    expect(peak).toBeGreaterThan(0.5);
    expect(peak).toBeLessThan(0.9);
  }
});

test('consecutive units on a side bend the output opposite ways', () => {
  const steps = unitsOf(widen(4).network)
    .slice(3)
    .map(({ step }) => step);

  // Ordinals 3 and 5 share a side; their slope steps must not stack, or the
  // ramp they build hides every kink in it.
  expect(Math.sign(steps[0] ?? 0)).not.toBe(Math.sign(steps[2] ?? 0));
});

test('the output gains structure with every unit rather than flattening', () => {
  const kinks = [0, 1, 2, 3, 4, 5].map((added) => visibleKinks(widen(added)));

  // Never fewer folds than the width before it, and clearly more by the end.
  for (const [index, count] of kinks.entries()) {
    expect(count).toBeGreaterThanOrEqual(kinks[index - 1] ?? 0);
  }

  expect(kinks.at(-1) ?? 0).toBeGreaterThan((kinks.at(0) ?? 0) * 2);
});

test('the output stays inside the preset teaching scale as units are added', () => {
  for (const added of [1, 2, 3, 4, 5]) {
    const ys = sampleNetwork(widen(added).network, xDomain, new Set()).map((sample) => sample.y);

    expect(Math.min(...ys)).toBeGreaterThan(defaultShallowPreset.fixedScale.y.min);
    expect(Math.max(...ys)).toBeLessThan(defaultShallowPreset.fixedScale.y.max);
  }
});

test('a widened network still evaluates at every sampled input', () => {
  const network = widen(5).network;

  for (const x of [-1, -0.5, 0, 0.5, 1]) {
    expect(Number.isFinite(evaluateNetwork(network, x, new Set()).y)).toBe(true);
  }
});

/** How many places the gradient of y changes by enough to see. */
function visibleKinks(state: ExplorerState): number {
  const ys = sampleNetwork(state.network, xDomain, new Set()).map((sample) => sample.y);
  const dx = (xDomain[1] - xDomain[0]) / (ys.length - 1);
  const gradients = ys.slice(1).map((y, index) => (y - (ys[index] ?? 0)) / dx);

  return gradients
    .slice(1)
    .filter((gradient, index) => Math.abs(gradient - (gradients[index] ?? 0)) > 0.1).length;
}
