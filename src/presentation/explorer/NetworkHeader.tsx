import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import type { ReactElement } from 'react';

import { countParameters } from '../../domain/network/countParameters';
import type { Network } from '../../domain/network/types';
import { architectureSummary, outputEquation } from './architectureSummary';

interface NetworkHeaderProps {
  readonly title: string;
  readonly network: Network;
  readonly onReset: () => void;
}

export function NetworkHeader({ title, network, onReset }: NetworkHeaderProps): ReactElement {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Stack gap={2}>
        <Title order={1} size="h4">
          {title}
        </Title>
        <Group gap="xs">
          <Text size="sm" ff="monospace">
            {architectureSummary(network)}
          </Text>
          <Text size="sm" c="dimmed">{`${String(countParameters(network))} parameters`}</Text>
        </Group>
        <Text size="sm" ff="monospace" c="dimmed">
          {outputEquation(network.output)}
        </Text>
      </Stack>
      <Group gap="sm" wrap="nowrap">
        {/* AGPL section 13: anyone interacting with a modified version over a
            network must be offered its corresponding source. */}
        <Anchor size="xs" href="https://github.com/eoin-obrien/neural-network-explorer">
          Source
        </Anchor>
        <Button variant="default" size="xs" onClick={onReset}>
          Reset
        </Button>
      </Group>
    </Group>
  );
}
