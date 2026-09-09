import { Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { unitRows } from '../charts/chartRows';
import { FunctionChart } from '../charts/FunctionChart';
import { subscript } from '../notation/notation';
import type { UnitCardModel } from './unitCards';
import type { UnitView } from './unitView';

interface UnitPlotsProps {
  readonly card: UnitCardModel;
  readonly view: UnitView;
}

const chartHeight = 96;

/**
 * The unit's two stages in the order the forward pass computes them: z_i(x),
 * then h_i(x) = a[z_i(x)]. Both are plotted against the original scalar x, so
 * the activation is read against the pre-activation it transforms.
 */
export function UnitPlots({ card, view }: UnitPlotsProps): ReactElement {
  const rows = unitRows(view.samples, card.unitId);
  // The probe is one more evaluation of these same functions, so it is shaped
  // by the same adapter and reaches the charts as a single marked row.
  const probeRows = unitRows([view.probe], card.unitId);
  const index = subscript([card.number]);

  return (
    <>
      <Text size="xs" ff="monospace">
        {card.zEquation}
      </Text>
      <FunctionChart
        rows={rows.z}
        probeRows={probeRows.z}
        xDomain={view.xDomain}
        valueRange={view.fixedScale.z}
        color="gray.7"
        name={`z${index}`}
        height={chartHeight}
      />

      <Text size="xs" ff="monospace">
        {card.hEquation}
      </Text>
      <FunctionChart
        rows={rows.h}
        probeRows={probeRows.h}
        xDomain={view.xDomain}
        valueRange={view.fixedScale.h}
        color="blue.6"
        name={`h${index}`}
        height={chartHeight}
      />
    </>
  );
}
