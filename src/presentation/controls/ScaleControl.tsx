import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { ScaleMode } from '../../application/explorer/explorerState';
import { scaleModeFor, scaleModes } from '../../application/explorer/explorerState';

interface ScaleControlProps {
  readonly mode: ScaleMode;
  readonly onChange: (mode: ScaleMode) => void;
}

const labels: Readonly<Record<ScaleMode, string>> = {
  fixed: 'Fixed',
  reachable: 'Reachable',
};

// The policy is stated in words as well as drawn: which axis a chart is using
// must be readable, not inferred from watching the ticks change.
const descriptions: Readonly<Record<ScaleMode, string>> = {
  fixed: 'Axes chosen by the preset',
  reachable: 'Axes from the values reached over x',
};

const options = scaleModes.map((mode) => ({ value: mode, label: labels[mode] }));
const labelId = 'chart-scale';

/**
 * The value axis is redrawn immediately when this changes rather than morphing
 * into place: an axis that animates between two scales shows, for the length of
 * the animation, a scale that is neither of them.
 */
export function ScaleControl({ mode, onChange }: ScaleControlProps): ReactElement {
  return (
    <Stack gap={4}>
      <Text size="xs" fw={500} id={labelId}>
        Chart scale
      </Text>
      <SegmentedControl
        size="xs"
        aria-labelledby={labelId}
        data={options}
        value={mode}
        // Choosing a mode narrows the control's plain string back to a mode, so
        // no caller has to assert that the control can only offer known ones.
        onChange={(value) => {
          scaleModeFor(value).forEach((chosen) => {
            onChange(chosen);
          });
        }}
      />
      <Text size="xs" c="dimmed">
        {descriptions[mode]}
      </Text>
    </Stack>
  );
}
