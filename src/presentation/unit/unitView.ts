import type { Dispatch } from 'react';

import type { ExcludedUnitIds, NetworkEvaluation, XDomain } from '../../domain/network/types';
import type { ExplorerAction } from '../../application/explorer/explorerReducer';
import type { FixedScale } from '../../application/presets/preset';

/** What every unit card needs regardless of which unit it draws. */
export interface UnitView {
  readonly samples: readonly NetworkEvaluation[];
  /** The forward pass at the probe: the same evaluation the summary reports. */
  readonly probe: NetworkEvaluation;
  readonly xDomain: XDomain;
  readonly fixedScale: FixedScale;
  readonly excludedUnitIds: ExcludedUnitIds;
  readonly dispatch: Dispatch<ExplorerAction>;
}
