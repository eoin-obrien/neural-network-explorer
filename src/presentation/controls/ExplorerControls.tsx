import { Group } from '@mantine/core';
import type { Dispatch, ReactElement } from 'react';

import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import type { ScaleMode } from '../../application/explorer/explorerState';
import type { Network, XDomain } from '../../domain/network/types';
import { ActivationControl } from './ActivationControl';
import { ProbeControl } from './ProbeControl';
import { ScaleControl } from './ScaleControl';

interface ExplorerControlsProps {
  readonly network: Network;
  readonly probeX: number;
  readonly xDomain: XDomain;
  readonly scaleMode: ScaleMode;
  readonly dispatch: Dispatch<ExplorerAction>;
}

/** The controls that apply to the whole network rather than to a single unit. */
export function ExplorerControls({
  network,
  probeX,
  xDomain,
  scaleMode,
  dispatch,
}: ExplorerControlsProps): ReactElement {
  return (
    <Group gap="lg" align="flex-start">
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
        xDomain={xDomain}
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
