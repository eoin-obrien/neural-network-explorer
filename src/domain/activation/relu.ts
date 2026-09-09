// Prince notation: a[z] = max(0, z).
export function relu(z: number): number {
  return Math.max(0, z);
}
