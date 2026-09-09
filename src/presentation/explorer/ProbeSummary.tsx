import { Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { NetworkEvaluation, UnitEvaluation } from '../../domain/network/types';
import { formatValue, subscript, unitIndices } from '../notation/notation';

interface ProbeSummaryProps {
  readonly probe: NetworkEvaluation;
}

/**
 * The forward pass at the probe, as text. This is the accessible inspection
 * mechanism: reading a value here never depends on hovering a chart.
 */
export function ProbeSummary({ probe }: ProbeSummaryProps): ReactElement {
  return (
    <Stack gap={2}>
      <Text size="xs" ff="monospace">{`x = ${formatValue(probe.x)}`}</Text>
      {probe.layers.map((layer, layerIndex) => (
        <Stack key={layer.layerId} gap={2}>
          {/* A single-layer network needs no layer heading to disambiguate. */}
          {probe.layers.length > 1 ? (
            <Text size="xs" c="dimmed">{`Layer ${String(layerIndex + 1)}`}</Text>
          ) : null}
          {layer.units.map((unit, unitIndex) => (
            <Text key={unit.unitId} size="xs" ff="monospace">
              {unitLine(unitIndices(layerIndex + 1, unitIndex + 1, probe.layers.length), unit)}
            </Text>
          ))}
        </Stack>
      ))}
      <Text size="xs" ff="monospace" fw={600}>{`y = ${formatValue(probe.y)}`}</Text>
    </Stack>
  );
}

function unitLine(indices: readonly number[], unit: UnitEvaluation): string {
  const index = subscript(indices);

  return `z${index} = ${formatValue(unit.z)} → h${index} = ${formatValue(unit.h)}`;
}
