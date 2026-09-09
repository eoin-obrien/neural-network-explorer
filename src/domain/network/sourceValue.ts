import type { NodeId } from './types';

/**
 * Connections name their source, so a source with no value means the network
 * describes a connection that does not exist. That is a malformed network
 * rather than a mathematical edge case, and silently reading it as zero would
 * plot a plausible-looking wrong function.
 */
export function sourceValue(sourceValues: ReadonlyMap<NodeId, number>, sourceId: NodeId): number {
  const value = sourceValues.get(sourceId);

  if (value === undefined) {
    throw new Error(`Connection source '${sourceId}' has no value in this forward pass.`);
  }

  return value;
}
