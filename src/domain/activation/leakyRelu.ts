// Prince notation: a[z] = z for z >= 0 and alpha*z for z < 0. Alpha is
// activation configuration, not a trainable theta/phi network parameter, so it
// travels with the layer's activation selection rather than its parameters.
export function leakyRelu(z: number, alpha: number): number {
  return z >= 0 ? z : alpha * z;
}
