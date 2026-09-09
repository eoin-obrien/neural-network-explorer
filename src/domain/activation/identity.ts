// Prince notation: a[z] = z. Identity is a teaching control: with identity at
// every hidden layer the whole network stays affine in x regardless of depth.
export function identity(z: number): number {
  return z;
}
