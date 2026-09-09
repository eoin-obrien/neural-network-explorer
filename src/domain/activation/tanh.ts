// Prince notation: a[z] = tanh(z). Named in the domain so every activation is
// reachable through the same registry rather than some being platform calls.
export function tanh(z: number): number {
  return Math.tanh(z);
}
