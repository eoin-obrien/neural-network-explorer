import type { Network, XDomain } from '../../domain/network/types';
import type { ValueRange } from '../../domain/range/reachableRange';

/**
 * Axis ranges chosen by the preset rather than by the data. A fixed teaching
 * scale keeps magnitude changes comparable while the sliders move, instead of
 * letting the axes chase the line.
 */
export interface FixedScale {
  readonly z: ValueRange;
  readonly h: ValueRange;
  readonly y: ValueRange;
}

/** Teaching data: a network plus the view configuration it is explored with. */
export interface Preset {
  readonly id: string;
  readonly title: string;
  readonly network: Network;
  readonly xDomain: XDomain;
  readonly fixedScale: FixedScale;
}
