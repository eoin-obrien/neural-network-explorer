import { Group, ScrollArea, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { HiddenUnitCard } from '../unit/HiddenUnitCard';
import type { LayerCardsModel } from '../unit/unitCards';
import type { UnitView } from '../unit/unitView';

interface UnitStripProps {
  readonly layer: LayerCardsModel;
  readonly view: UnitView;
}

/**
 * Horizontal scroll rather than a fixed column count: one unit, three, or
 * twelve all render from the same data without a layout assumption.
 */
export function UnitStrip({ layer, view }: UnitStripProps): ReactElement {
  const headingId = `layer-${layer.layerId}`;

  return (
    // A section rather than a labelled div: aria-labelledby names a region only
    // when the element it sits on has a role, and the layer is what tells a
    // screen reader which layer's neurons it has reached.
    <Stack component="section" aria-labelledby={headingId} gap="xs">
      <Text size="sm" fw={600} id={headingId}>
        Hidden layer {layer.number}
      </Text>
      <ScrollArea type="auto" offsetScrollbars>
        <Group gap="sm" wrap="nowrap" align="stretch">
          {layer.cards.map((card) => (
            <HiddenUnitCard key={card.unitId} card={card} view={view} />
          ))}
        </Group>
      </ScrollArea>
    </Stack>
  );
}
