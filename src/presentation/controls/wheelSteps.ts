/**
 * How far a wheel gesture has travelled, in notches. One notch of a mouse wheel
 * arrives as a single large delta; a trackpad sends a stream of much smaller
 * ones. Converting to notches and spending them whole makes a notch exactly one
 * step, and keeps a trackpad flick from sweeping a parameter across its range.
 */
const pixelsPerNotch = 100;
const linesPerNotch = 3;

export interface WheelSteps {
  /** Steps to take now. Positive raises the value. */
  readonly steps: number;
  /** The fraction of a notch left over, to carry into the next event. */
  readonly carried: number;
}

export function wheelSteps(event: WheelEvent, carried: number): WheelSteps {
  const scrolled = carried + notchesOf(event);
  // Scrolling up reports a negative deltaY and raises the value, the direction
  // the slider's own up-arrow key moves it.
  const steps = -Math.trunc(scrolled);

  // Math.trunc keeps the sign it was given, and a negated zero stays negative:
  // normalised so that "no step yet" is one value rather than two.
  return { steps: steps === 0 ? 0 : steps, carried: scrolled % 1 };
}

// deltaMode says what unit deltaY is measured in. Firefox reports lines on some
// platforms, where a raw pixel reading would be about thirty times too small.
function notchesOf(event: WheelEvent): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY / linesPerNotch;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY;
  }

  return event.deltaY / pixelsPerNotch;
}
