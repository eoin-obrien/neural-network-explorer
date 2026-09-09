import { Group, Slider, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { formatValue } from '../notation/notation';
import type { ControlRange } from './parameterRanges';
import { parameterStep } from './parameterRanges';

interface ParameterSliderProps {
  /** The parameter as the equations write it, for example θ₁₀. */
  readonly symbol: string;
  /** Its plain-language meaning, for example "intercept". */
  readonly description: string;
  readonly value: number;
  readonly range: ControlRange;
  readonly onChange: (value: number) => void;
}

export function ParameterSlider({
  symbol,
  description,
  value,
  range,
  onChange,
}: ParameterSliderProps): ReactElement {
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="xs" ff="monospace" w={110} lh={1.2}>
        {symbol}{' '}
        <Text span size="xs" c="dimmed">
          {description}
        </Text>
      </Text>
      <Slider
        flex={1}
        // The accessible name carries both the symbol and its meaning, so the
        // control is identifiable without seeing the equation beside it.
        thumbLabel={`${symbol} — ${description}`}
        value={value}
        min={range.min}
        max={range.max}
        step={parameterStep}
        precision={2}
        label={null}
        onChange={onChange}
      />
      <Text size="xs" ff="monospace" w={42} ta="right">
        {formatValue(value)}
      </Text>
    </Group>
  );
}
