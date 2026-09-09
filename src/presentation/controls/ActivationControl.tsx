import { Select, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { ActivationSelection } from '../../domain/activation/activation';
import {
  activationDefinitions,
  activationIds,
  activationSelectionFor,
} from '../../domain/activation/activation';

interface ActivationControlProps {
  readonly selection: ActivationSelection;
  readonly onChange: (selection: ActivationSelection) => void;
}

const options = activationIds.map((id) => ({ value: id, label: activationDefinitions[id].name }));

export function ActivationControl({ selection, onChange }: ActivationControlProps): ReactElement {
  return (
    <Stack gap={4}>
      <Select
        label="Activation a[z]"
        size="xs"
        w={200}
        data={options}
        value={selection.id}
        allowDeselect={false}
        // Choosing an activation yields that activation's own selection, so no
        // caller has to know which activations carry configuration.
        onChange={(value) => {
          activationSelectionFor(value).forEach((chosen) => {
            onChange(chosen);
          });
        }}
      />
      <Text size="xs" ff="monospace" c="dimmed">
        {activationDefinitions[selection.id].notation}
      </Text>
    </Stack>
  );
}
