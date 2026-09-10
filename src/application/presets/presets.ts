import { defaultShallowPreset } from './defaultShallow';
import type { Preset } from './preset';
import { singleHingePreset } from './singleHinge';
import { twoLayerPreset } from './twoLayer';

/**
 * The teaching order: one hinge, then three composing into a shape, then the
 * same idea a layer deeper. Presets are data — none of them reaches special-case
 * code, and the view renders whatever width and depth it is handed.
 */
export const presets: readonly Preset[] = [singleHingePreset, defaultShallowPreset, twoLayerPreset];

/** Where the page starts: the shallow network the notation is written for. */
export const initialPreset: Preset = defaultShallowPreset;

/**
 * A selector hands back a plain string, or nothing. Narrowing here keeps the
 * caller total, so an unrecognized id selects nothing rather than being
 * asserted into a preset.
 */
export function presetFor(id: string | null): readonly Preset[] {
  return presets.filter((preset) => preset.id === id);
}
