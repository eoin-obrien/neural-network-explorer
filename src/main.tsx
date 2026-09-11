import { MantineProvider } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { theme } from './presentation/theme';

// Mantine ships unbundled styles; Charts styles are loaded here so the measured
// production baseline reflects the full teaching shell, not Core alone.
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './presentation/theme.css';

const container = document.getElementById('root');

if (container === null) {
  throw new Error('index.html must provide a #root mount element.');
}

createRoot(container).render(
  <StrictMode>
    {/* One scheme, whatever the operating system prefers. The charts, the
        dimmed contrast ratios and the strip's scrollbar are all chosen against
        a light ground, and a teaching view that changes colour underneath a
        class is a variable nobody asked for. */}
    <MantineProvider theme={theme} forceColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
);
