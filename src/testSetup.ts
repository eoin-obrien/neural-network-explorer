import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom implements no media queries, but Mantine's provider resolves the color
// scheme through matchMedia on mount. A permanently non-matching stub keeps the
// light scheme deterministic across runs.
const matchMediaStub = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) satisfies Omit<MediaQueryList, keyof EventTarget> & Partial<EventTarget> as MediaQueryList;

window.matchMedia = matchMediaStub;

// Testing Library only auto-cleans when Vitest globals are enabled; this project
// keeps globals off so test APIs stay explicitly imported.
afterEach(cleanup);
