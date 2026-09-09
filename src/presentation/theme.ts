import { createTheme } from '@mantine/core';

/**
 * Under prefers-reduced-motion Mantine drops its transitions everywhere rather
 * than component by component. Nothing in this application needs motion to be
 * understood, so honouring the preference costs nothing.
 */
export const theme = createTheme({ respectReducedMotion: true });
