import { Select, Stack, Text } from '@mantine/core';
import type { ReactElement } from 'react';

import type { Preset } from '../../application/presets/preset';
import { presetFor, presets } from '../../application/presets/presets';

interface PresetControlProps {
  readonly preset: Preset;
  readonly onChange: (preset: Preset) => void;
}

const options = presets.map(({ id, title }) => ({ value: id, label: title }));

/**
 * Presets are teaching data, so choosing one starts a fresh exploration of that
 * network rather than editing the current one: every parameter, the probe and
 * every exclusion return to what the preset declares.
 */
export function PresetControl({ preset, onChange }: PresetControlProps): ReactElement {
  return (
    <Stack gap={4}>
      <Select
        label="Network"
        size="xs"
        w={200}
        data={options}
        value={preset.id}
        allowDeselect={false}
        onChange={(value) => {
          presetFor(value).forEach((chosen) => {
            onChange(chosen);
          });
        }}
      />
      <Text size="xs" c="dimmed" maw={200}>
        {preset.lesson}
      </Text>
    </Stack>
  );
}
