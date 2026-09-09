import type { ReactElement } from 'react';

import { defaultShallowPreset } from './application/presets/defaultShallow';
import { NetworkExplorer } from './presentation/explorer/NetworkExplorer';

export function App(): ReactElement {
  return <NetworkExplorer preset={defaultShallowPreset} />;
}
