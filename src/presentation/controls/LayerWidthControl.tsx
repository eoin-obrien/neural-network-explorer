import { Button, Group } from '@mantine/core';
import type { ReactElement } from 'react';

import { minLayerWidth } from '../../application/explorer/resizeLayer';

interface LayerWidthControlProps {
  readonly layerNumber: number;
  readonly unitCount: number;
  readonly onAdd: () => void;
  readonly onRemove: () => void;
}

// A bound on the control, not on the mathematics: the domain evaluates any
// width and the strip scrolls to whatever it is handed. Past a handful of units
// the cards stop being comparable at a glance, which is what the strip is for,
// so the teaching control stops here. The same distinction as the slider ranges.
const maxLayerWidth = 8;

/**
 * Width is a property of the network, so these buttons write theta and phi: the
 * new unit arrives with its own parameters and with the connection that reads
 * it. They sit beside the layer they change rather than among the exploration
 * controls, none of which touch a parameter.
 */
export function LayerWidthControl({
  layerNumber,
  unitCount,
  onAdd,
  onRemove,
}: LayerWidthControlProps): ReactElement {
  // The accessible name says which layer as well as what the button does, so
  // the two strips of a deeper network are never ambiguous out of context.
  const layer = `hidden layer ${String(layerNumber)}`;

  return (
    <Group gap={4} wrap="nowrap">
      <Button
        variant="default"
        size="compact-xs"
        disabled={unitCount <= minLayerWidth}
        aria-label={`Remove a neuron from ${layer}`}
        onClick={onRemove}
      >
        Remove
      </Button>
      <Button
        variant="default"
        size="compact-xs"
        disabled={unitCount >= maxLayerWidth}
        aria-label={`Add a neuron to ${layer}`}
        onClick={onAdd}
      >
        Add
      </Button>
    </Group>
  );
}
