import { Card, Group, Stack, Switch, Text } from '@mantine/core';
import type { Dispatch, ReactElement } from 'react';
import { useState } from 'react';

import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import type {
  ExcludedUnitIds,
  NetworkEvaluation,
  OutputLayer,
  XDomain,
} from '../../domain/network/types';
import type { ValueRange } from '../../domain/range/reachableRange';
import { outputPlot } from '../charts/chartRows';
import { FunctionChart } from '../charts/FunctionChart';
import { ParameterSlider } from '../controls/ParameterSlider';
import { phi0Range } from '../controls/parameterRanges';
import { ProbeSummary } from './ProbeSummary';

interface OutputSectionProps {
  readonly output: OutputLayer;
  readonly samples: readonly NetworkEvaluation[];
  /** The point marked on the curve, which may be a render behind the control. */
  readonly probe: NetworkEvaluation;
  /** The forward pass as stated in text, which never is. */
  readonly reading: NetworkEvaluation;
  readonly xDomain: XDomain;
  readonly valueRange: ValueRange;
  readonly excludedUnitIds: ExcludedUnitIds;
  readonly dispatch: Dispatch<ExplorerAction>;
}

export function OutputSection({
  output,
  samples,
  probe,
  reading,
  xDomain,
  valueRange,
  excludedUnitIds,
  dispatch,
}: OutputSectionProps): ReactElement {
  // Purely visual: whether the terms are drawn changes nothing about y.
  const [showTerms, setShowTerms] = useState(false);
  const plot = outputPlot(samples);

  return (
    <Card withBorder padding="sm">
      <Stack gap="xs">
        {/* The equation itself is stated once, in the header. */}
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={600}>
            Output y(x)
          </Text>
          <Switch
            size="xs"
            labelPosition="left"
            label="Show φᵢhᵢ terms"
            checked={showTerms}
            onChange={(event) => {
              setShowTerms(event.currentTarget.checked);
            }}
          />
        </Group>
        {silenced(output, excludedUnitIds) ? (
          <Text size="xs" fw={500}>
            Every unit is excluded, so y is the constant φ₀.
          </Text>
        ) : null}
        <Group align="flex-start" gap="md" wrap="nowrap">
          <Stack gap="xs" flex={1} miw={0}>
            <FunctionChart
              rows={plot.rows}
              // The probe is the same function at one x, shaped by the same adapter.
              probeRows={outputPlot([probe]).rows}
              terms={showTerms ? plot.terms : []}
              xDomain={xDomain}
              valueRange={valueRange}
              color="indigo.7"
              name="y"
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
          <ProbeSummary probe={reading} />
        </Group>
      </Stack>
    </Card>
  );
}

/**
 * Every unit the output reads is withheld, so the sum has nothing left in it.
 * Worth saying outright: a flat line at φ₀ otherwise looks like a broken chart
 * rather than the arithmetic doing exactly what it should.
 */
function silenced(output: OutputLayer, excludedUnitIds: ExcludedUnitIds): boolean {
  return (
    output.incomingPhi.length > 0 &&
    output.incomingPhi.every((phi) => excludedUnitIds.has(phi.sourceId))
  );
}
