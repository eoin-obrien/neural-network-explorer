import { Group, Slider, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { XDomain } from '../../domain/network/types';
import { formatValue } from '../notation/notation';
import { parameterStep } from './parameterRanges';

interface ProbeControlProps {
  readonly probeX: number;
  readonly xDomain: XDomain;
  readonly onChange: (value: number) => void;
}

/**
 * The persistent probe, not an ephemeral chart hover: it is keyboard operable
 * and its values are readable as text, so inspection never depends on pointing.
 */
export function ProbeControl({ probeX, xDomain, onChange }: ProbeControlProps): ReactElement {
  return (
    <Stack gap={4} w={240}>
      <Text size="xs" fw={500}>
        Probe x
      </Text>
      <Group gap="xs" wrap="nowrap">
        <Slider
          flex={1}
          thumbLabel="x — network input"
          value={probeX}
          min={xDomain[0]}
          max={xDomain[1]}
          step={parameterStep}
          precision={2}
          label={null}
          onChange={onChange}
        />
        <Text size="xs" ff="monospace" w={44} ta="right">
          {formatValue(probeX)}
        </Text>
      </Group>
    </Stack>
  );
}
