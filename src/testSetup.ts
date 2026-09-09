import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom implements no media queries, but Mantine's provider resolves the color
// scheme through matchMedia on mount. A permanently non-matching stub keeps the
// light scheme deterministic across runs.
const matchMediaStub = (query: string): MediaQueryList =>
  ({
    // Only a request to reduce motion matches: tests then exercise the same
    // motion-free rendering the application must support anyway, and no
    // assertion has to wait for a transition to finish. Matching the whole
    // query would also answer true to its negation, no-preference.
    matches: query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) satisfies Omit<MediaQueryList, keyof EventTarget> & Partial<EventTarget> as MediaQueryList;

window.matchMedia = matchMediaStub;

// jsdom performs no layout, so nothing observes a size change. Mantine's
// ScrollArea and the charts' responsive container both construct a
// ResizeObserver on mount; a stub that never reports keeps them mountable.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {
    return undefined;
  }

  unobserve(): void {
    return undefined;
  }

  disconnect(): void {
    return undefined;
  }
}

window.ResizeObserver = ResizeObserverStub;

// jsdom has no scrolling, so the combobox cannot bring its active option into
// view. Without this the dropdown throws on a deferred callback after the test
// that opened it has already finished.
Element.prototype.scrollIntoView = () => undefined;

// Testing Library only auto-cleans when Vitest globals are enabled; this project
// keeps globals off so test APIs stay explicitly imported.
afterEach(cleanup);
