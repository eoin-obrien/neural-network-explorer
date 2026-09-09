// Prince notation: a[z] = 1 / (1 + exp(-z)), the logistic function.
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}
