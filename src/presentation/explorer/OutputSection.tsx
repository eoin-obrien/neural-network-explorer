import { Card, Group, Stack, Text } from '@mantine/core';
import type { Dispatch, ReactElement } from 'react';

import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import type { FixedScale } from '../../application/presets/preset';
import type { NetworkEvaluation, OutputLayer, XDomain } from '../../domain/network/types';
import { outputRows } from '../charts/chartRows';
import { FunctionChart } from '../charts/FunctionChart';
import { ParameterSlider } from '../controls/ParameterSlider';
import { phi0Range } from '../controls/parameterRanges';
import { ProbeSummary } from './ProbeSummary';

interface OutputSectionProps {
  readonly output: OutputLayer;
  readonly samples: readonly NetworkEvaluation[];
  readonly probe: NetworkEvaluation;
  readonly xDomain: XDomain;
  readonly fixedScale: FixedScale;
  readonly dispatch: Dispatch<ExplorerAction>;
}

export function OutputSection({
  output,
  samples,
  probe,
  xDomain,
  fixedScale,
  dispatch,
}: OutputSectionProps): ReactElement {
  return (
    <Card withBorder padding="sm">
      <Stack gap="xs">
        {/* The equation itself is stated once, in the header. */}
        <Text size="sm" fw={600}>
          Output y(x)
        </Text>
        <Group align="flex-start" gap="md" wrap="nowrap">
          <Stack gap="xs" flex={1} miw={0}>
            <FunctionChart
              rows={outputRows(samples)}
              xDomain={xDomain}
              valueRange={fixedScale.y}
              color="indigo.7"
              label="y"
              height={220}
            />
            <ParameterSlider
              symbol="φ₀"
              description="output intercept"
              value={output.phi0}
              range={phi0Range}
              onChange={(value) => {
                dispatch({ type: 'setPhi0', value });
              }}
            />
          </Stack>
          <ProbeSummary probe={probe} />
        </Group>
      </Stack>
    </Card>
  );
}
