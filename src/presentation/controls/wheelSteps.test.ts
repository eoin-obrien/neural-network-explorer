import { expect, test } from 'vitest';

import { wheelSteps } from './wheelSteps';

function wheel(deltaY: number, deltaMode: number = WheelEvent.DOM_DELTA_PIXEL): WheelEvent {
  return new WheelEvent('wheel', { deltaY, deltaMode });
}

test('scrolling up raises the value and scrolling down lowers it', () => {
  expect(wheelSteps(wheel(-100), 0).steps).toBe(1);
  expect(wheelSteps(wheel(100), 0).steps).toBe(-1);
});

test('one notch is one step however hard it is scrolled', () => {
  expect(wheelSteps(wheel(-300), 0).steps).toBe(3);
});

// A trackpad sends a stream of small deltas; without carrying, none of them
// would ever amount to a step and the slider would ignore the gesture.
test('scroll too small to be a step is carried into the next event', () => {
  const first = wheelSteps(wheel(-40), 0);

  expect(first.steps).toBe(0);

  const second = wheelSteps(wheel(-40), first.carried);

  expect(second.steps).toBe(0);
  expect(wheelSteps(wheel(-40), second.carried).steps).toBe(1);
});

test('the leftover of a spent notch is carried rather than discarded', () => {
  const spent = wheelSteps(wheel(-150), 0);

  expect(spent.steps).toBe(1);
  expect(wheelSteps(wheel(-60), spent.carried).steps).toBe(1);
});

// Firefox reports lines on some platforms, where a notch is about three lines
// rather than about a hundred pixels.
test('a line-mode notch is one step, not a thirtieth of one', () => {
  expect(wheelSteps(wheel(-3, WheelEvent.DOM_DELTA_LINE), 0).steps).toBe(1);
});

test('a page-mode notch is one step', () => {
  expect(wheelSteps(wheel(-1, WheelEvent.DOM_DELTA_PAGE), 0).steps).toBe(1);
});

test('a reversal spends the carry back rather than accumulating it', () => {
  const up = wheelSteps(wheel(-60), 0);

  expect(wheelSteps(wheel(60), up.carried).steps).toBe(0);
  expect(wheelSteps(wheel(160), up.carried).steps).toBe(-1);
});
