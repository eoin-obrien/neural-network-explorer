import { Group } from '@mantine/core';
import type { Dispatch, ReactElement } from 'react';

import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import type { ExplorerState } from '../../application/explorer/explorerState';
import { ActivationControl } from './ActivationControl';
import { PresetControl } from './PresetControl';
import { ProbeControl } from './ProbeControl';
import { ScaleControl } from './ScaleControl';

interface ExplorerControlsProps {
  readonly state: ExplorerState;
  readonly dispatch: Dispatch<ExplorerAction>;
}

/** The controls that apply to the whole network rather than to a single unit. */
export function ExplorerControls({ state, dispatch }: ExplorerControlsProps): ReactElement {
  const { network, preset, probeX, scaleMode } = state;

  return (
    <Group gap="lg" align="flex-start">
      <PresetControl
        preset={preset}
        onChange={(chosen) => {
          dispatch({ type: 'selectPreset', preset: chosen });
        }}
      />
      {/* One selector applies to every hidden layer in this view; the first
          layer's selection is what it displays. */}
      {network.hiddenLayers.slice(0, 1).map((layer) => (
        <ActivationControl
          key={layer.id}
          selection={layer.activation}
          onChange={(selection) => {
            dispatch({ type: 'setActivation', selection });
          }}
        />
      ))}
      <ProbeControl
        probeX={probeX}
        xDomain={preset.xDomain}
        onChange={(value) => {
          dispatch({ type: 'setProbeX', value });
        }}
      />
      <ScaleControl
        mode={scaleMode}
        onChange={(mode) => {
          dispatch({ type: 'setScaleMode', mode });
        }}
      />
    </Group>
  );
}
