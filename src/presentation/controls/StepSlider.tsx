import { Slider } from '@mantine/core';
import { useEventListener, useFocusWithin, useMergedRef } from '@mantine/hooks';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { ControlRange } from './parameterRanges';
import { parameterStep } from './parameterRanges';
import { wheelSteps } from './wheelSteps';

interface StepSliderProps {
  /** The accessible name: the symbol together with its plain-language meaning. */
  readonly thumbLabel: string;
  readonly value: number;
  readonly range: ControlRange;
  readonly onChange: (value: number) => void;
}

// The listener has to be able to call preventDefault, so it cannot be passive.
// React attaches its own onWheel passively and could not stop the page moving.
const wheelOptions: AddEventListenerOptions = { passive: false };

/**
 * A slider the wheel nudges one step at a time, for adjustments finer than a
 * drag across a short track can make.
 *
 * The wheel acts only once the slider holds focus. A control that took the
 * wheel on hover would rewrite the mathematics under a learner who was merely
 * scrolling the page past it.
 */
export function StepSlider({ thumbLabel, value, range, onChange }: StepSliderProps): ReactElement {
  const carried = useRef(0);
  const latest = useRef(value);
  const { ref: focusRef, focused } = useFocusWithin();

  // Wheel events can arrive faster than React re-renders, so a step is taken
  // from the value the previous one asked for rather than from a stale prop.
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!focused) {
        return;
      }

      // The page must not scroll out from under a slider being adjusted.
      event.preventDefault();

      const wheeled = wheelSteps(event, carried.current);
      carried.current = wheeled.carried;

      if (wheeled.steps !== 0) {
        latest.current = stepped(latest.current + wheeled.steps * parameterStep, range);
        onChange(latest.current);
      }
    },
    [focused, range, onChange],
  );

  const ref = useMergedRef(focusRef, useEventListener('wheel', handleWheel, wheelOptions));

  return (
    <Slider
      ref={ref}
      flex={1}
      thumbLabel={thumbLabel}
      value={value}
      min={range.min}
      max={range.max}
      step={parameterStep}
      precision={2}
      label={null}
      onChange={onChange}
    />
  );
}

// Held to the step grid the arrow keys move on, so the wheel can only reach
// values a keyboard can: no parameter value should be pointer-only.
function stepped(value: number, range: ControlRange): number {
  const onGrid = Math.round(value / parameterStep) * parameterStep;

  return Math.min(Math.max(onGrid, range.min), range.max);
}
