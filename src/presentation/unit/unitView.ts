import type { Dispatch } from 'react';

import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import type { ExcludedUnitIds, NetworkEvaluation, XDomain } from '../../domain/network/types';
import type { LayerRanges } from '../../domain/range/networkRanges';

/** What every unit card needs regardless of which unit it draws. */
export interface UnitView {
  readonly samples: readonly NetworkEvaluation[];
  /** The forward pass at the probe: the same evaluation the summary reports. */
  readonly probe: NetworkEvaluation;
  readonly xDomain: XDomain;
  /** Shared across the layer, so cards side by side stay comparable. */
  readonly scale: LayerRanges;
  readonly excludedUnitIds: ExcludedUnitIds;
  readonly dispatch: Dispatch<ExplorerAction>;
}
