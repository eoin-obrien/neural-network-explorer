// Prince notation: a[z] = z for z >= 0 and alpha*z for z < 0. Alpha is
// activation configuration, not a trainable theta/phi network parameter, so it
// travels with the layer's activation selection rather than its parameters.
export function leakyRelu(z: number, alpha: number): number {
  // Leaky ReLU is continuous at zero: a[0] is 0 whether the boundary is taken
  // on the identity branch or the alpha one, so no test can tell >= from > here.
  // The >= is the definition; the mutant is equivalent, not uncaught.
  // Stryker disable next-line EqualityOperator: equivalent at z = 0, where both branches give 0
  return z >= 0 ? z : alpha * z;
}
