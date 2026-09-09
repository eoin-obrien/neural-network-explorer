import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // nn.eoin.ai serves this application at its root, so production asset URLs
  // must not be prefixed with the repository name.
  base: '/',
  plugins: [react()],
});
