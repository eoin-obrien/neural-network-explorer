const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉';

/**
 * Prince writes theta_{i0}: the indices are juxtaposed rather than separated.
 * A comma appears only once an index reaches two digits, where juxtaposition
 * would render theta_{1,0} and theta_{10} as the same string.
 */
export function subscript(indices: readonly number[]): string {
  const separator = indices.some((index) => index > 9) ? ',' : '';

  return indices.map(subscriptOf).join(separator);
}

function subscriptOf(index: number): string {
  return String(index).replace(/\d/g, (digit) => subscriptDigits.charAt(Number(digit)));
}

/**
 * Prince indexes a deeper network's units by layer as well: z_li, theta_lij.
 * A network with a single hidden layer drops the layer index, exactly as the
 * shallow equations do. Without this, layer 1 unit 1 and layer 2 unit 1 both
 * write z_1, and two different sliders both read theta_11.
 */
export function unitIndices(
  layerNumber: number,
  unitNumber: number,
  layerCount: number,
): readonly number[] {
  return layerCount > 1 ? [layerNumber, unitNumber] : [unitNumber];
}

/**
 * Two decimals everywhere so values do not change width as sliders move.
 * Number() collapses a rounded -0.00 so a value that rounds to zero never
 * displays a misleading minus sign.
 */
export function formatValue(value: number): string {
  return Number(value.toFixed(2)).toFixed(2);
}

/**
 * How a unit's activation is written wherever something else refers to it: h₁
 * in a shallow network, h₂₁ for unit 1 of layer 2 once there is depth. A deeper
 * layer's incoming weights and the output equation both have to name activations
 * the way the card that owns them does.
 */
export function activationSymbol(
  layerNumber: number,
  unitNumber: number,
  layerCount: number,
): string {
  return `h${subscript(unitIndices(layerNumber, unitNumber, layerCount))}`;
}
