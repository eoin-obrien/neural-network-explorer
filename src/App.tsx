import type { ReactElement } from 'react';

import { initialPreset } from './application/presets/presets';
import { NetworkExplorer } from './presentation/explorer/NetworkExplorer';

export function App(): ReactElement {
  return <NetworkExplorer preset={initialPreset} />;
}
