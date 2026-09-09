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
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
);
