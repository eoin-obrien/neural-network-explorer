import { Container, Stack } from '@mantine/core';
import type { ReactElement } from 'react';
import { useReducer } from 'react';

import { explorerReducer } from '../../application/explorer/explorerReducer';
import { initialExplorerState } from '../../application/explorer/explorerState';
import type { Preset } from '../../application/presets/preset';
import { evaluateNetwork } from '../../domain/network/evaluateNetwork';
import { sampleNetwork } from '../../domain/network/sampleNetwork';
import type { LayerId } from '../../domain/network/types';
import { layerScale, outputScale } from '../charts/chartScale';
import { ExplorerControls } from '../controls/ExplorerControls';
import { layerCards } from '../unit/unitCards';
import type { UnitView } from '../unit/unitView';
import { NetworkHeader } from './NetworkHeader';
import { OutputSection } from './OutputSection';
import { UnitStrip } from './UnitStrip';

interface NetworkExplorerProps {
  readonly preset: Preset;
}

export function NetworkExplorer({ preset }: NetworkExplorerProps): ReactElement {
  const [state, dispatch] = useReducer(explorerReducer, preset, initialExplorerState);
  const { network, probeX, excludedUnitIds, scaleMode } = state;

  // Derived, never stored: the plotted function, the probe and the axis ranges
  // are all recomputed from the canonical network on every render.
  const samples = sampleNetwork(network, preset.xDomain, excludedUnitIds);
  const probe = evaluateNetwork(network, probeX, excludedUnitIds);

  const view = (layerId: LayerId): UnitView => ({
    samples,
    probe,
    xDomain: preset.xDomain,
    scale: layerScale(scaleMode, preset.fixedScale, samples, layerId),
    excludedUnitIds,
    dispatch,
  });

  return (
    <Container component="main" size="xl" py="md">
      <Stack gap="md">
        <NetworkHeader
          title={preset.title}
          network={network}
          onReset={() => {
            dispatch({ type: 'reset', preset });
          }}
        />
        <ExplorerControls
          network={network}
          probeX={probeX}
          xDomain={preset.xDomain}
          scaleMode={scaleMode}
          dispatch={dispatch}
        />
        {layerCards(network).map((layer) => (
          <UnitStrip key={layer.layerId} layer={layer} view={view(layer.layerId)} />
        ))}
        <OutputSection
          output={network.output}
          samples={samples}
          probe={probe}
          xDomain={preset.xDomain}
          valueRange={outputScale(scaleMode, preset.fixedScale, samples)}
          dispatch={dispatch}
        />
      </Stack>
    </Container>
  );
}
