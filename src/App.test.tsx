import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { App } from './App';

test('renders the application heading', () => {
  render(
    <MantineProvider>
      <App />
    </MantineProvider>,
  );

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Neural network explorer');
});
