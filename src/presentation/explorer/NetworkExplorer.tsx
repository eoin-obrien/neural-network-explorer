import { Container, Group, Stack } from '@mantine/core';
import type { ReactElement } from 'react';
import { useReducer } from 'react';

import { explorerReducer } from '../../application/explorer/explorerReducer';
import { initialExplorerState } from '../../application/explorer/explorerState';
import type { Preset } from '../../application/presets/preset';
import { evaluateNetwork } from '../../domain/network/evaluateNetwork';
import { sampleNetwork } from '../../domain/network/sampleNetwork';
import { ActivationControl } from '../controls/ActivationControl';
import { ProbeControl } from '../controls/ProbeControl';
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
  const { network, probeX, excludedUnitIds } = state;

  // Derived, never stored: the plotted function and the probe are recomputed
  // from the canonical network on every render.
  const samples = sampleNetwork(network, preset.xDomain, excludedUnitIds);
  const probe = evaluateNetwork(network, probeX, excludedUnitIds);

  const view: UnitView = {
    samples,
    probe,
    xDomain: preset.xDomain,
    fixedScale: preset.fixedScale,
    excludedUnitIds,
    dispatch,
  };

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
        <Group gap="lg" align="flex-start">
          {/* One selector applies to every hidden layer in this view; the
              first layer's selection is what it displays. */}
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
        </Group>
        {layerCards(network).map((layer) => (
          <UnitStrip key={layer.layerId} layer={layer} view={view} />
        ))}
        <OutputSection
          output={network.output}
          samples={samples}
          probe={probe}
          xDomain={preset.xDomain}
          fixedScale={preset.fixedScale}
          dispatch={dispatch}
        />
      </Stack>
    </Container>
  );
}
