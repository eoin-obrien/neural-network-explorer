import { Container, Stack } from '@mantine/core';
import type { ReactElement } from 'react';
import { useDeferredValue, useReducer } from 'react';

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
  /** Where the exploration starts; the selector may replace it from there. */
  readonly preset: Preset;
}

export function NetworkExplorer({ preset: initial }: NetworkExplorerProps): ReactElement {
  const [state, dispatch] = useReducer(explorerReducer, initial, initialExplorerState);
  const { preset, network } = state;

  /*
   * The controls answer the pointer; the curves catch up.
   *
   * Sampling and drawing every plot is the expensive half of a parameter
   * change, and a drag emits far more events than that half can service. The
   * sliders and the equations read the state as it is, so a thumb tracks the
   * pointer, while the plots read a deferred copy that React is free to
   * abandon when a newer value has already arrived. Nothing is stored twice:
   * both are the same canonical state, one render behind at worst.
   */
  const drawn = useDeferredValue(state);
  const samples = sampleNetwork(drawn.network, drawn.preset.xDomain, drawn.excludedUnitIds);
  const probe = evaluateNetwork(drawn.network, drawn.probeX, drawn.excludedUnitIds);

  const view = (layerId: LayerId): UnitView => ({
    samples,
    probe,
    xDomain: drawn.preset.xDomain,
    scale: layerScale(drawn.scaleMode, drawn.preset.fixedScale, samples, layerId),
    // Live rather than deferred: this drives the inclusion switch, not the
    // curves. The exclusion is already in the samples, as a withheld
    // contribution, so a switch answers its own click immediately.
    excludedUnitIds: state.excludedUnitIds,
    dispatch,
  });

  return (
    <Container component="main" size="xl" py="md">
      <Stack gap="md">
        <NetworkHeader
          title={preset.title}
          network={network}
          onReset={() => {
            dispatch({ type: 'reset' });
          }}
        />
        <ExplorerControls state={state} dispatch={dispatch} />
        {layerCards(network).map((layer) => (
          <UnitStrip key={layer.layerId} layer={layer} view={view(layer.layerId)} />
        ))}
        <OutputSection
          output={network.output}
          samples={samples}
          probe={probe}
          xDomain={drawn.preset.xDomain}
          valueRange={outputScale(drawn.scaleMode, drawn.preset.fixedScale, samples)}
          excludedUnitIds={state.excludedUnitIds}
          dispatch={dispatch}
        />
      </Stack>
    </Container>
  );
}
