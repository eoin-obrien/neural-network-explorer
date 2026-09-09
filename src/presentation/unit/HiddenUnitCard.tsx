import { Card, Group, Stack, Switch, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { unitRows } from '../charts/chartRows';
import { FunctionChart } from '../charts/FunctionChart';
import { subscript } from '../notation/notation';
import classes from './HiddenUnitCard.module.css';
import type { UnitCardModel } from './unitCards';
import { UnitParameters } from './UnitParameters';
import type { UnitView } from './unitView';

interface HiddenUnitCardProps {
  readonly card: UnitCardModel;
  readonly view: UnitView;
}

const chartHeight = 96;

export function HiddenUnitCard({ card, view }: HiddenUnitCardProps): ReactElement {
  const excluded = view.excludedUnitIds.has(card.unitId);
  const rows = unitRows(view.samples, card.unitId);
  const index = subscript([card.number]);

  return (
    <Card
      component="article"
      aria-label={`Neuron ${String(card.number)}`}
      withBorder
      padding="sm"
      w={300}
      // The strip scrolls; cards never compress. A narrow viewport must not
      // squeeze a plot into an unreadable sliver.
      flex="0 0 auto"
      className={[classes['card'], excluded ? classes['excluded'] : ''].join(' ')}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="sm">
            Neuron {card.number}
          </Text>
          <Switch
            size="xs"
            labelPosition="left"
            label="Included"
            aria-label={`Neuron ${String(card.number)} included`}
            checked={!excluded}
            onChange={(event) => {
              view.dispatch({
                type: 'setUnitExcluded',
                unitId: card.unitId,
                excluded: !event.currentTarget.checked,
              });
            }}
          />
        </Group>

        {/* Exclusion is stated, not only implied by the muting: the change must
            be perceivable without relying on colour or motion. The controls
            stay editable, and restoring the unit uses their current values. */}
        {excluded ? (
          <Text size="xs" fw={500}>
            Excluded from the output
          </Text>
        ) : null}

        <Text size="xs" ff="monospace">
          {card.zEquation}
        </Text>
        <FunctionChart
          rows={rows.z}
          xDomain={view.xDomain}
          valueRange={view.fixedScale.z}
          color="gray.7"
          label={`z${index}`}
          height={chartHeight}
        />

        <Text size="xs" ff="monospace">
          {card.hEquation}
        </Text>
        <FunctionChart
          rows={rows.h}
          xDomain={view.xDomain}
          valueRange={view.fixedScale.h}
          color="blue.6"
          label={`h${index}`}
          height={chartHeight}
        />

        <UnitParameters card={card} dispatch={view.dispatch} />
      </Stack>
    </Card>
  );
}
