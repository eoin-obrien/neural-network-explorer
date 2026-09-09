import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { App } from './App';
import { theme } from './presentation/theme';

test('renders the explorer for the default preset', () => {
  render(
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>,
  );

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Shallow neural network');
  expect(screen.getByText('10 parameters')).toBeDefined();
});
